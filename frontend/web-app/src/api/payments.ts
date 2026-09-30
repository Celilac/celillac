// frontend/web-app/src/api/payments.ts
import { apiClient } from './client';

export interface PaymentDetailsDTO {
  id: string;
  orderId: string;
  consumerId: string;
  partnerId: string;
  gateway: string;
  gatewayTransactionId?: string;
  method: 'PIX' | 'CREDIT_CARD';
  status: 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';
  grossAmount: number;
  netPartnerAmount: number;
  platformFeeAmount: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  pixExpiresAt?: string;
  paidAt?: string;
}

export interface CheckoutInput {
  orderId: string;
  method: 'PIX' | 'CREDIT_CARD';
  creditCardToken?: string;
  customerInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
  };
}

export interface PartnerFinancialAccountDTO {
  id: string;
  partnerId: string;
  gatewaySubaccountId?: string;
  pixKey: string;
  pixKeyType: 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS';
  isVerified: boolean;
}

export interface SetupFinancialAccountInput {
  pixKey: string;
  pixKeyType: 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS';
}

export const paymentsApi = {
  checkout: (data: CheckoutInput, token?: string) =>
    apiClient.post<PaymentDetailsDTO>('/payments/checkout', data, token),

  getPaymentByOrderId: (orderId: string, token?: string) =>
    apiClient.get<PaymentDetailsDTO>(`/payments/order/${orderId}`, token),

  setupPartnerFinancialAccount: (
    partnerId: string,
    data: SetupFinancialAccountInput,
    token?: string
  ) =>
    apiClient.post<PartnerFinancialAccountDTO>(
      `/partner/${partnerId}/financial-account`,
      data,
      token
    ),

  getPartnerFinancialAccount: (partnerId: string, token?: string) =>
    apiClient.get<PartnerFinancialAccountDTO>(
      `/partner/${partnerId}/financial-account`,
      token
    ),
};
