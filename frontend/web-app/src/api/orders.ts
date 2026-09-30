// frontend/web-app/src/api/orders.ts
import { apiClient } from './client';

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

  updateOrderStatus: (
    orderId: string,
    action: 'CONFIRM' | 'START_PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED',
    token?: string
  ) =>
    apiClient.patch<OrderDTO>(`/orders/${orderId}/status`, { action }, token),
};
