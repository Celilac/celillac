import { apiClient, getApiBaseUrl } from './client';

export interface OrderNotificationDTO {
  orderId: string;
  partnerId: string;
  partnerName?: string;
  consumerId: string;
  totalAmount: number;
  status: string;
  confirmedAt: string;
  itemsSummary?: string;
  metadata?: Record<string, unknown>;
}

export interface OrderItemDTO {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderDTO {
  id: string;
  consumerId: string;
  partnerId: string;
  status:
    | 'CREATED'
    | 'AWAITING_PAYMENT'
    | 'PAID'
    | 'CONFIRMED'
    | 'PREPARING'
    | 'READY_FOR_PICKUP'
    | 'OUT_FOR_DELIVERY'
    | 'DELIVERED'
    | 'CANCELLED';
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  allergenCheckVerdict: 'SAFE' | 'WARNING';
  notes?: string;
  paymentMethod?: string;
  changeFor?: number;
  items: OrderItemDTO[];
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  partnerId: string;
  items: Array<{ productId: string; quantity: number }>;
  deliveryFee?: number;
  notes?: string;
}

export interface ReportNonPaymentInput {
  reason: 'CLIENT_REFUSED_PAYMENT' | 'CLIENT_ABSENT' | 'FRAUDULENT_ORDER';
  details?: string;
}

export interface ReportNonPaymentOutput {
  reportId: string;
  orderId: string;
  orderStatus: string;
  consumerBlockedFromDeliveryPayment: boolean;
  platformFeeWaived: boolean;
}

export const ordersApi = {
  createOrder: (data: CreateOrderInput, token?: string) =>
    apiClient.post<OrderDTO>('/orders', data, token),

  getMyOrders: (token?: string) =>
    apiClient.get<OrderDTO[]>('/orders/me', token),

  getOrderById: (orderId: string, token?: string) =>
    apiClient.get<OrderDTO>(`/orders/${orderId}`, token),

  getPartnerOrders: (partnerId: string, token?: string) =>
    apiClient.get<OrderDTO[]>(`/orders/partner/${partnerId}`, token),

  cancelOrder: (orderId: string, reason: string, token?: string) =>
    apiClient.post<{ orderId: string; status: string; requiresRefund: boolean; cancelReason: string }>(
      `/orders/${orderId}/cancel`,
      { reason },
      token
    ),

  reportNonPayment: (orderId: string, data: ReportNonPaymentInput, token?: string) =>
    apiClient.post<ReportNonPaymentOutput>(
      `/orders/${orderId}/report-non-payment`,
      data,
      token
    ),

  updateOrderStatus: (
    orderId: string,
    action: 'CONFIRM' | 'START_PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED',
    token?: string
  ) =>
    apiClient.patch<OrderDTO>(`/orders/${orderId}/status`, { action }, token),

  getOrderStreamUrl: (options?: { partnerId?: string; token?: string }) => {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    if (options?.partnerId) params.append('partnerId', options.partnerId);
    if (options?.token) params.append('token', options.token);
    const queryString = params.toString();
    return `${baseUrl}/orders/stream${queryString ? `?${queryString}` : ''}`;
  },
};
