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
      return Result.ok<CreatePixChargeOutput>({
        transactionId: `pay_asaas_${Date.now()}`,
        pixQrCode: `https://celilac.dev/mock-pix-qr/${input.orderId}`,
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136${input.orderId}520400005303986540${input.grossAmount}5802BR5913CELILAC6009SAOPAULO62070503***6304ABCD`,
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
