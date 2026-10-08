// backend/src/infrastructure/workers/OrderExpirationWorker.ts
import { CancelExpiredOrdersUseCase } from '../../application/order/CancelExpiredOrdersUseCase';

export interface OrderExpirationWorkerConfig {
  intervalMs?: number;
  partnerTimeoutMinutes?: number;
  paymentTimeoutMinutes?: number;
}

export class OrderExpirationWorker {
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private isProcessing: boolean = false;

  constructor(
    private readonly cancelExpiredOrdersUseCase: CancelExpiredOrdersUseCase,
    private readonly config: OrderExpirationWorkerConfig = {}
  ) {}

  public start(): void {
    if (this.isRunning) {
      return;
    }

    const intervalMs =
      this.config.intervalMs ??
      (process.env.ORDER_EXPIRATION_WORKER_INTERVAL_MS
        ? Number(process.env.ORDER_EXPIRATION_WORKER_INTERVAL_MS)
        : 60000); // 60 segundos por padrão

    this.isRunning = true;

    // Executa a primeira varredura após um pequeno delay inicial de boot (5 segundos)
    setTimeout(() => {
      this.tick();
    }, 5000);

    this.timer = setInterval(() => {
      this.tick();
    }, intervalMs);

    // Garante que o timer não impeça o término do processo Node se necessário
    if (this.timer.unref) {
      this.timer.unref();
    }

    console.log(
      `[OrderExpirationWorker]: Iniciado com intervalo de ${intervalMs / 1000}s (Timeout Parceiro: ${
        this.config.partnerTimeoutMinutes || 15
      }m, Timeout Pagamento: ${this.config.paymentTimeoutMinutes || 10}m)`
    );
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
    console.log('[OrderExpirationWorker]: Parado.');
  }

  private async tick(): Promise<void> {
    if (!this.isRunning || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    try {
      const partnerTimeout =
        this.config.partnerTimeoutMinutes ??
        (process.env.ORDER_TIMEOUT_PARTNER_RESPONSE_MINUTES
          ? Number(process.env.ORDER_TIMEOUT_PARTNER_RESPONSE_MINUTES)
          : undefined);

      const paymentTimeout =
        this.config.paymentTimeoutMinutes ??
        (process.env.ORDER_TIMEOUT_PAYMENT_SELECTION_MINUTES
          ? Number(process.env.ORDER_TIMEOUT_PAYMENT_SELECTION_MINUTES)
          : undefined);

      const result = await this.cancelExpiredOrdersUseCase.execute({
        partnerTimeoutMinutes: partnerTimeout,
        paymentTimeoutMinutes: paymentTimeout,
      });

      if (result.isSuccess) {
        const val = result.getValue();
        if (val.processedCount > 0) {
          console.log(
            `[OrderExpirationWorker]: ${val.processedCount} pedido(s) expirado(s) cancelado(s) automaticamente com sucesso.`
          );
        }
      }
    } catch (error: any) {
      console.error(
        '[OrderExpirationWorker]: Erro inesperado durante varredura periódica de pedidos expirados:',
        error?.message || error
      );
    } finally {
      this.isProcessing = false;
    }
  }
}
