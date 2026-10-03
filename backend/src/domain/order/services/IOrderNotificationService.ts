// backend/src/domain/order/services/IOrderNotificationService.ts

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

export interface IOrderNotificationService {
  /**
   * Notifica o parceiro comercial em tempo real sobre pagamento confirmado.
   */
  notifyPaymentConfirmed(partnerId: string, payload: OrderNotificationDTO): void;

  /**
   * Notifica o consumidor ou parceiro sobre alteração no ciclo de vida do pedido.
   */
  notifyOrderStatusChanged(recipientId: string, payload: OrderNotificationDTO): void;
}
