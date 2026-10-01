// backend/tests/unit/domain/payment/Payment.spec.ts
import { Payment } from '../../../../src/domain/payment/entities/Payment';
import { PartnerFinancialAccount } from '../../../../src/domain/payment/entities/PartnerFinancialAccount';
import { PaymentRefund } from '../../../../src/domain/payment/entities/PaymentRefund';
import {
  PaymentMethod,
  PaymentStatus,
  SplitCalculator,
} from '../../../../src/domain/payment/value-objects/PaymentStatus';

describe('Payment Bounded Context Domain Tests', () => {
  describe('SplitCalculator (iFood Marketplace Model)', () => {
    it('deve calcular corretamente a comissão de 12% da CeLiLac e o repasse líquido ao parceiro', () => {
      // Subtotal de itens R$ 100,00 + taxa de entrega R$ 10,00 = R$ 110,00 total bruto
      // Comissão de 12% sobre itens = R$ 12,00
      // Repasse líquido do parceiro = 110 - 12 = R$ 98,00
      const split = SplitCalculator.calculate(100.0, 10.0);

      expect(split.grossAmount).toBe(110.0);
      expect(split.platformFeeAmount).toBe(12.0);
      expect(split.netPartnerAmount).toBe(98.0);
    });

    it('deve suportar cálculo sem taxa de entrega (retirada no local)', () => {
      // Subtotal R$ 50,00
      // Comissão 12% = R$ 6,00
      // Líquido parceiro = R$ 44,00
      const split = SplitCalculator.calculate(50.0, 0);

      expect(split.grossAmount).toBe(50.0);
      expect(split.platformFeeAmount).toBe(6.0);
      expect(split.netPartnerAmount).toBe(44.0);
    });
  });

  describe('Payment Entity', () => {
    it('deve instanciar uma transação de pagamento com valores e split calculados', () => {
      const paymentResult = Payment.create({
        orderId: 'order-1',
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        method: PaymentMethod.PIX,
        subtotalAmount: 80.0,
        deliveryFee: 15.0,
      });

      expect(paymentResult.isSuccess).toBe(true);
      const payment = paymentResult.getValue();
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.method).toBe(PaymentMethod.PIX);
      expect(payment.grossAmount).toBe(95.0);
      expect(payment.platformFeeAmount).toBe(9.6); // 12% de 80
      expect(payment.netPartnerAmount).toBe(85.4); // 95 - 9.6
      expect(payment.createdAt).toBeInstanceOf(Date);
    });

    it('deve atualizar detalhes do PIX e transição de status', () => {
      const payment = Payment.create({
        orderId: 'order-1',
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
      }).getValue();

      const expires = new Date();
      payment.setPixDetails('data:image/png;base64,mockqr', '000201pixcopypaste', expires);
      expect(payment.pixQrCode).toBe('data:image/png;base64,mockqr');
      expect(payment.pixCopyPaste).toBe('000201pixcopypaste');
      expect(payment.pixExpiresAt).toBe(expires);

      // Confirmar pagamento
      expect(payment.markAsPaid().isSuccess).toBe(true);
      expect(payment.status).toBe(PaymentStatus.PAID);
      expect(payment.paidAt).toBeInstanceOf(Date);

      // Estornar pagamento
      expect(payment.markAsRefunded().isSuccess).toBe(true);
      expect(payment.status).toBe(PaymentStatus.REFUNDED);
    });

    it('deve falhar transições inválidas e cobrir validações de criação', () => {
      const payment = Payment.create({
        orderId: 'order-1',
        consumerId: 'consumer-1',
        partnerId: 'partner-1',
        method: PaymentMethod.PIX,
        subtotalAmount: 50.0,
      }).getValue();

      // Testar getters
      expect(payment.orderId).toBe('order-1');
      expect(payment.consumerId).toBe('consumer-1');
      expect(payment.partnerId).toBe('partner-1');
      expect(payment.gateway).toBe('ASAAS');
      expect(payment.gatewayTransactionId).toBeUndefined();
      payment.setGatewayTransactionId('gtw-123');
      expect(payment.gatewayTransactionId).toBe('gtw-123');
      expect(payment.updatedAt).toBeInstanceOf(Date);

      // Não pode estornar antes de ser pago
      expect(payment.markAsRefunded().isFailure).toBe(true);

      // Falhar pagamento
      expect(payment.markAsFailed('Cartão recusado').isSuccess).toBe(true);
      expect(payment.status).toBe(PaymentStatus.FAILED);
      expect(payment.failureReason).toBe('Cartão recusado');

      // Não pode falhar pagamento já pago
      const paidPayment = Payment.create({
        orderId: 'order-2',
        consumerId: 'consumer-2',
        partnerId: 'partner-2',
        method: PaymentMethod.PIX,
        subtotalAmount: 50,
      }).getValue();
      paidPayment.markAsPaid();
      expect(paidPayment.markAsFailed('Erro').isFailure).toBe(true);

      // Idempotência de markAsPaid
      expect(paidPayment.markAsPaid().isSuccess).toBe(true);

      // Não pode pagar se estiver REFUNDED
      paidPayment.markAsRefunded();
      expect(paidPayment.markAsPaid().isFailure).toBe(true);

      // Validações de criação
      expect(Payment.create({ orderId: '', consumerId: 'c', partnerId: 'p', method: PaymentMethod.PIX, subtotalAmount: 10 }).isFailure).toBe(true);
      expect(Payment.create({ orderId: 'o', consumerId: '', partnerId: 'p', method: PaymentMethod.PIX, subtotalAmount: 10 }).isFailure).toBe(true);
      expect(Payment.create({ orderId: 'o', consumerId: 'c', partnerId: '', method: PaymentMethod.PIX, subtotalAmount: 10 }).isFailure).toBe(true);
      expect(Payment.create({ orderId: 'o', consumerId: 'c', partnerId: 'p', method: PaymentMethod.PIX, subtotalAmount: 0 }).isFailure).toBe(true);
    });
  });

  describe('PartnerFinancialAccount Entity', () => {
    it('deve criar conta financeira para recebimento de repasses e testar getters', () => {
      const accountResult = PartnerFinancialAccount.create({
        partnerId: 'partner-1',
        pixKey: '12345678000199',
        pixKeyType: 'CNPJ',
        bankCode: '260',
        agencyNumber: '0001',
        accountNumber: '12345-6',
        accountType: 'CHECKING',
      });

      expect(accountResult.isSuccess).toBe(true);
      const account = accountResult.getValue();
      expect(account.partnerId).toBe('partner-1');
      expect(account.pixKey).toBe('12345678000199');
      expect(account.pixKeyType).toBe('CNPJ');
      expect(account.bankCode).toBe('260');
      expect(account.agencyNumber).toBe('0001');
      expect(account.accountNumber).toBe('12345-6');
      expect(account.accountType).toBe('CHECKING');
      expect(account.isVerified).toBe(false);
      expect(account.createdAt).toBeInstanceOf(Date);
      expect(account.updatedAt).toBeInstanceOf(Date);

      account.setSubaccountId('subacc_123');
      expect(account.gatewaySubaccountId).toBe('subacc_123');
      expect(account.isVerified).toBe(true);

      account.updatePixKey('nova@pix.com', 'EMAIL');
      expect(account.pixKey).toBe('nova@pix.com');
      expect(account.pixKeyType).toBe('EMAIL');

      // Validações
      expect(PartnerFinancialAccount.create({ partnerId: '', pixKey: 'k', pixKeyType: 'CPF' }).isFailure).toBe(true);
      expect(PartnerFinancialAccount.create({ partnerId: 'p', pixKey: ' ', pixKeyType: 'CPF' }).isFailure).toBe(true);
    });
  });

  describe('PaymentRefund Entity', () => {
    it('deve criar e completar registro de estorno financeiro e testar falha', () => {
      const refundResult = PaymentRefund.create({
        paymentId: 'pay-123',
        refundAmount: 50.0,
        reason: 'Cancelamento antes do aceite',
      });

      expect(refundResult.isSuccess).toBe(true);
      const refund = refundResult.getValue();
      expect(refund.status).toBe('PENDING');
      expect(refund.paymentId).toBe('pay-123');
      expect(refund.refundAmount).toBe(50.0);
      expect(refund.reason).toBe('Cancelamento antes do aceite');
      expect(refund.createdAt).toBeInstanceOf(Date);

      refund.complete('ref_asaas_999');
      expect(refund.status).toBe('COMPLETED');
      expect(refund.gatewayRefundId).toBe('ref_asaas_999');

      const failedRefund = PaymentRefund.create({
        paymentId: 'pay-456',
        refundAmount: 30.0,
        reason: 'Falha',
      }).getValue();
      failedRefund.fail();
      expect(failedRefund.status).toBe('FAILED');

      // Validações
      expect(PaymentRefund.create({ paymentId: '', refundAmount: 10, reason: 'r' }).isFailure).toBe(true);
      expect(PaymentRefund.create({ paymentId: 'p', refundAmount: 0, reason: 'r' }).isFailure).toBe(true);
      expect(PaymentRefund.create({ paymentId: 'p', refundAmount: 10, reason: ' ' }).isFailure).toBe(true);
    });
  });
});
