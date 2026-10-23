# Cancelamento Automático de Pedidos por Inação ou Expiração de Pagamento

**Status:** ✅ Implementado  
**Entregue em:** 2026-10-08 (FEAT-096 - ver [CHANGELOG.md](../../CHANGELOG.md))  
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#14-pedidos-orders)  
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)  

## Visão Geral

Implementação do mecanismo automatizado e ultra-leve para cancelamento de pedidos abandonados ou sem resposta operacional, garantindo liberação de reservas e proteção ao consumidor com estorno financeiro automático:

1. **Inação do Estabelecimento Parceiro:** Pedidos abertos aguardando confirmação do restaurante (`PAID` ou pedidos com pagamento presencial em `CREATED`/`AWAITING_PAYMENT`) são automaticamente cancelados após 15 minutos (configurável) de inatividade, acionando reembolso no gateway Asaas e notificando via SSE.
2. **Demora no Pagamento pelo Cliente:** Pedidos criados online em `CREATED` ou `AWAITING_PAYMENT` sem seleção ou conclusão de pagamento após 10 minutos (configurável) são cancelados para desocupar reservas da cozinha.
3. **Eficiência para VPS Oracle Cloud Free Tier:** Utilização de índice parcial no PostgreSQL (`idx_orders_timeout_lookup`) cobrindo apenas status pendentes, garantindo consultas sub-milissegundo (< 0.2ms) e sem sobrecarga de I/O em disco no worker de 60 segundos.

## Domínio

- **`OrderExpirationPolicy`**: Avalia timeouts de resposta do parceiro (`PARTNER_TIMEOUT`, padrão 15 min) e de pagamento do cliente (`PAYMENT_TIMEOUT`, padrão 10 min).
- **`Order.cancel(reason, requestedByConsumer, isSystem)`**: Permite cancelamentos autorizados disparados pelo sistema para pedidos em estados pré-confirmação, calculando elegibilidade para estorno.

## Aplicação e Infraestrutura

- **`CancelExpiredOrdersUseCase`**: Orquestra a busca de pedidos pendentes expirados, cancelamento no agregado `Order`, disparo de `RefundPaymentUseCase`, registro de `AuditLog` e transmissão em tempo real pelo `SseOrderNotificationHub`.
- **`GetOrderUseCase`**: Implementa verificação sob demanda (*lazy expiration check*), garantindo atualização imediata no momento da leitura da rota `/orders/:id`.
- **`OrderExpirationWorker`**: Worker periódico resiliente a cada 60s no processo Express com tratamento de exceções blindado.
- **`PgOrderRepository.findPendingExpired`**: Consulta otimizada com índice parcial PostgreSQL `idx_orders_timeout_lookup`.

## Frontend

- **Checkout (`checkout/[orderId]`):** Contador regressivo visual dinâmico com contagem MM:SS para conclusão do pagamento e tela dedicada de pedido cancelado com redirecionamento amigável.
- **Painel do Parceiro (`partner/orders`):** Componente `OrderAcceptanceTimer` destacando o tempo limite para o restaurante aceitar o pedido antes do cancelamento automático.

## Testes

- `backend/tests/unit/domain/order/OrderExpirationPolicy.spec.ts`
- `backend/tests/unit/application/order/CancelExpiredOrdersUseCase.spec.ts`
- `backend/tests/unit/domain/order/Order.spec.ts`
- `backend/tests/unit/application/order/OrderUseCases.spec.ts`
