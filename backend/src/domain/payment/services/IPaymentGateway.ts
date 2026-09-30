// backend/src/domain/payment/services/IPaymentGateway.ts
import { Result } from '../../Result';
import { PaymentStatus } from '../value-objects/PaymentStatus';

export interface CreateSubaccountInput {
  partnerId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address: string;
}

export interface CreateSubaccountOutput {
  subaccountId: string;
}

export interface CreatePixChargeInput {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  partnerSubaccountId: string;
  netPartnerAmount: number;
}

export interface CreatePixChargeOutput {
  transactionId: string;
  pixQrCode: string;
  pixCopyPaste: string;
  expiresAt: Date;
}

export interface CreateCreditCardChargeInput {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  customerCpfCnpj: string;
  cardToken: string;
  partnerSubaccountId: string;
  netPartnerAmount: number;
}

export interface CreateCreditCardChargeOutput {
  transactionId: string;
  status: PaymentStatus;
}

export interface RefundChargeInput {
  gatewayTransactionId: string;
  refundAmount: number;
  reason: string;
}

export interface RefundChargeOutput {
  gatewayRefundId: string;
}

export interface IPaymentGateway {
  createSubaccount(input: CreateSubaccountInput): Promise<Result<CreateSubaccountOutput>>;
  createPixCharge(input: CreatePixChargeInput): Promise<Result<CreatePixChargeOutput>>;
  createCreditCardCharge(input: CreateCreditCardChargeInput): Promise<Result<CreateCreditCardChargeOutput>>;
  refundCharge(input: RefundChargeInput): Promise<Result<RefundChargeOutput>>;
}
