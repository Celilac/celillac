// backend/src/infrastructure/notifications/SseOrderNotificationHub.ts
import { IOrderNotificationService, OrderNotificationDTO } from '../../domain/order/services/IOrderNotificationService';

export interface SseClientWriter {
  write: (chunk: any) => boolean | void;
}

export interface SseClient {
  id: string;
  userId: string;
  partnerId?: string;
  partnerIds?: string[];
  userRole?: string;
  res: SseClientWriter;
}

export class SseOrderNotificationHub implements IOrderNotificationService {
  private clients: Map<string, SseClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly heartbeatPeriodMs: number;

  constructor(heartbeatPeriodMs = 25000) {
    this.heartbeatPeriodMs = heartbeatPeriodMs;
    // Não inicializa heartbeat automaticamente no construtor para evitar timers pendentes em testes unitários.
  }

  /**
   * Inicia o envio periódico de comentários keep-alive para evitar desconexão por proxies reversos.
   */
  public startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      this.broadcastKeepAlive();
    }, this.heartbeatPeriodMs);
    if (this.heartbeatInterval.unref) {
      this.heartbeatInterval.unref();
    }
  }

  /**
   * Encerra o timer de heartbeat (usado em shutdown e testes).
   */
  public stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Registra uma nova conexão SSE de um cliente autenticado.
   */
  public addClient(client: SseClient): void {
    this.clients.set(client.id, client);
    if (!this.heartbeatInterval && this.clients.size > 0) {
      this.startHeartbeat();
    }
  }

  /**
   * Remove a conexão quando o cliente encerra a requisição.
   */
  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
    if (this.clients.size === 0) {
      this.stopHeartbeat();
    }
  }

  /**
   * Retorna o total de conexões ativas no momento.
   */
  public getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Limpa todos os clientes e timers (usado em testes).
   */
  public clear(): void {
    this.stopHeartbeat();
    this.clients.clear();
  }

  /**
   * Dispara notificação de pagamento confirmado para o parceiro comercial responsável.
   */
  public notifyPaymentConfirmed(partnerId: string, payload: OrderNotificationDTO): void {
    const message = this.formatSseMessage('order:payment_confirmed', payload);

    for (const client of this.clients.values()) {
      const isTargetPartner =
        client.partnerId === partnerId ||
        (client.partnerIds && client.partnerIds.includes(partnerId));
      const isAdmin = client.userRole === 'ADMIN';

      if (isTargetPartner || isAdmin) {
        try {
          client.res.write(message);
        } catch {
          this.removeClient(client.id);
        }
      }
    }
  }

  /**
   * Dispara notificação de mudança de status para o interessado (consumidor, parceiro ou admin).
   */
  public notifyOrderStatusChanged(recipientId: string, payload: OrderNotificationDTO): void {
    const message = this.formatSseMessage('order:status_updated', payload);

    for (const client of this.clients.values()) {
      const isTargetUser = client.userId === recipientId;
      const isTargetPartner =
        client.partnerId === recipientId ||
        (client.partnerIds && client.partnerIds.includes(recipientId));
      const isAdmin = client.userRole === 'ADMIN';

      if (isTargetUser || isTargetPartner || isAdmin) {
        try {
          client.res.write(message);
        } catch {
          this.removeClient(client.id);
        }
      }
    }
  }

  /**
   * Envia comentário de heartbeat para todas as conexões ativas.
   */
  private broadcastKeepAlive(): void {
    const keepAliveComment = ': keep-alive\n\n';
    for (const client of this.clients.values()) {
      try {
        client.res.write(keepAliveComment);
      } catch {
        this.removeClient(client.id);
      }
    }
  }

  /**
   * Formata os dados no padrão canônico do protocolo Server-Sent Events.
   */
  private formatSseMessage(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }
}

// Instância compartilhada do Hub de Notificações
export const sseOrderNotificationHub = new SseOrderNotificationHub();
