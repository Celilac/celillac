// backend/src/infrastructure/gateways/AsaasPaymentGateway.ts
import { Result } from '../../domain/Result';
import {
  IPaymentGateway,
  CreateSubaccountInput,
  CreateSubaccountOutput,
  CreatePixChargeInput,
  CreatePixChargeOutput,
  CreateCreditCardChargeInput,
  CreateCreditCardChargeOutput,
  RefundChargeInput,
  RefundChargeOutput,
} from '../../domain/payment/services/IPaymentGateway';
import { PaymentStatus } from '../../domain/payment/value-objects/PaymentStatus';

export class AsaasPaymentGateway implements IPaymentGateway {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(apiKey?: string, apiUrl?: string) {
    this.apiKey = apiKey || process.env.ASAAS_API_KEY || '';
    this.apiUrl = apiUrl || process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
  }

  async createSubaccount(input: CreateSubaccountInput): Promise<Result<CreateSubaccountOutput>> {
    // Modo simulação para testes e ambiente local sem API Key
    if (!this.apiKey || process.env.NODE_ENV === 'test') {
      return Result.ok<CreateSubaccountOutput>({
        subaccountId: `subacc_asaas_${input.partnerId.substring(0, 8)}`,
      });
    }

    try {
      const response = await fetch(`${this.apiUrl}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
        },
        body: JSON.stringify({
          name: input.name,
          email: input.email,
          cpfCnpj: input.cpfCnpj.replace(/\D/g, ''),
          mobilePhone: input.phone.replace(/\D/g, ''),
          address: input.address,
        }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        return Result.fail<CreateSubaccountOutput>(
          errorData.errors?.[0]?.description || `Falha ao criar subconta no Asaas (HTTP ${response.status})`
        );
      }

      const data: any = await response.json();
      return Result.ok<CreateSubaccountOutput>({
        subaccountId: data.id,
      });
    } catch (err: any) {
      return Result.fail<CreateSubaccountOutput>(`Erro de comunicação com o gateway Asaas: ${err.message}`);
    }
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<Result<CreatePixChargeOutput>> {
    // Modo simulação para testes e dev sem API Key
    if (!this.apiKey || process.env.NODE_ENV === 'test') {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      const formattedAmount = input.grossAmount.toFixed(2);
      const rawPayload = `00020126580014br.gov.bcb.pix0136${input.orderId}520400005303986540${formattedAmount}5802BR5913CELILAC LTDA6009SAO PAULO62070503***6304`;
      
      // Cálculo do CRC16-CCITT (Polinômio 0x1021) conforme padrão Bacen EMV-Co
      let crc = 0xffff;
      for (let i = 0; i < rawPayload.length; i++) {
        crc ^= rawPayload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          if ((crc & 0x8000) !== 0) {
            crc = ((crc << 1) ^ 0x1021) & 0xffff;
          } else {
            crc = (crc << 1) & 0xffff;
          }
        }
      }
      const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
      const pixCopyPaste = `${rawPayload}${crcHex}`;

      return Result.ok<CreatePixChargeOutput>({
        transactionId: `pay_asaas_${Date.now()}`,
        pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(pixCopyPaste)}`,
        pixCopyPaste,
        expiresAt,
      });
    }

    try {
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 30);

      const payload: any = {
        billingType: 'PIX',
        value: input.grossAmount,
        dueDate: new Date().toISOString().split('T')[0],
        externalReference: input.orderId,
        customer: {
          name: input.customerName,
          email: input.customerEmail,
          cpfCnpj: input.customerCpfCnpj.replace(/\D/g, ''),
        },
      };

      // Split de marketplace com subconta do parceiro
      if (input.partnerSubaccountId && input.netPartnerAmount > 0) {
        payload.split = [
          {
            walletId: input.partnerSubaccountId,
            fixedValue: input.netPartnerAmount,
          },
        ];
      }

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        return Result.fail<CreatePixChargeOutput>(
          errorData.errors?.[0]?.description || `Falha ao gerar cobrança no Asaas (HTTP ${response.status})`
        );
      }

      const paymentData: any = await response.json();

      // Buscar QR code PIX
      const qrResponse = await fetch(`${this.apiUrl}/payments/${paymentData.id}/pixQrCode`, {
        headers: { access_token: this.apiKey },
      });
      const qrData: any = await qrResponse.json().catch(() => ({}));

      return Result.ok<CreatePixChargeOutput>({
        transactionId: paymentData.id,
        pixQrCode: qrData.encodedImage || '',
        pixCopyPaste: qrData.payload || '',
        expiresAt,
      });
    } catch (err: any) {
      return Result.fail<CreatePixChargeOutput>(`Erro de comunicação com o gateway Asaas: ${err.message}`);
    }
  }

  async createCreditCardCharge(input: CreateCreditCardChargeInput): Promise<Result<CreateCreditCardChargeOutput>> {
    if (!this.apiKey || process.env.NODE_ENV === 'test') {
      return Result.ok<CreateCreditCardChargeOutput>({
        transactionId: `pay_cc_asaas_${Date.now()}`,
        status: PaymentStatus.PAID,
      });
    }

    try {
      const payload: any = {
        billingType: 'CREDIT_CARD',
        value: input.grossAmount,
        dueDate: new Date().toISOString().split('T')[0],
        externalReference: input.orderId,
        creditCardToken: input.cardToken,
        customer: {
          name: input.customerName,
          email: input.customerEmail,
          cpfCnpj: input.customerCpfCnpj.replace(/\D/g, ''),
        },
      };

      if (input.partnerSubaccountId && input.netPartnerAmount > 0) {
        payload.split = [
          {
            walletId: input.partnerSubaccountId,
            fixedValue: input.netPartnerAmount,
          },
        ];
      }

      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        return Result.fail<CreateCreditCardChargeOutput>(
          errorData.errors?.[0]?.description || `Falha na cobrança com cartão no Asaas (HTTP ${response.status})`
        );
      }

      const paymentData: any = await response.json();
      const status =
        paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED'
          ? PaymentStatus.PAID
          : PaymentStatus.AUTHORIZED;

      return Result.ok<CreateCreditCardChargeOutput>({
        transactionId: paymentData.id,
        status,
      });
    } catch (err: any) {
      return Result.fail<CreateCreditCardChargeOutput>(`Erro de comunicação com o gateway Asaas: ${err.message}`);
    }
  }

  async refundCharge(input: RefundChargeInput): Promise<Result<RefundChargeOutput>> {
    if (!this.apiKey || process.env.NODE_ENV === 'test') {
      return Result.ok<RefundChargeOutput>({
        gatewayRefundId: `ref_asaas_${Date.now()}`,
      });
    }

    try {
      const response = await fetch(`${this.apiUrl}/payments/${input.gatewayTransactionId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          access_token: this.apiKey,
        },
        body: JSON.stringify({
          value: input.refundAmount,
          description: input.reason,
        }),
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        return Result.fail<RefundChargeOutput>(
          errorData.errors?.[0]?.description || `Falha ao estornar cobrança no Asaas (HTTP ${response.status})`
        );
      }

      const data: any = await response.json();
      return Result.ok<RefundChargeOutput>({
        gatewayRefundId: data.id || `ref_${Date.now()}`,
      });
    } catch (err: any) {
      return Result.fail<RefundChargeOutput>(`Erro de comunicação com o gateway Asaas: ${err.message}`);
    }
  }
}
