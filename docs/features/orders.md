# Pedidos (Orders)

**Status:** ✅ Implementado
**Entregue em:** 2026-09-30 (FEAT-094 - ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#14-pedidos-orders)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#11-pedidos)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST`  | `/orders` | Criação de novo pedido pelo consumidor com validação biológica obrigatória |
| `GET`   | `/orders/me` | Listagem dos pedidos do consumidor autenticado |
| `GET`   | `/orders/:id` | Detalhes do pedido específico com rastreamento de status e itens |
| `GET`   | `/orders/partner/:partnerId` | Listagem dos pedidos recebidos pelo estabelecimento parceiro |
| `POST`  | `/orders/:id/cancel` | Cancelamento do pedido com política de reembolso |
| `PATCH` | `/orders/:id/status` | Transição de status operacional do pedido pelo parceiro |

## Domínio

- **Aggregate Root:** `Order` (`id`, `orderNumber`, `consumerId`, `partnerId`, `items`, `status`, `deliveryAddress`, `notes`, `subtotal`, `deliveryFee`, `total`, `isRefundEligible`, `createdAt`, `updatedAt`)
- **Entity:** `OrderItem` (`id`, `productId`, `productName`, `unitPrice`, `quantity`, `subtotal`)
- **Value Objects:** `OrderStatus` (`CREATED`, `AWAITING_PAYMENT`, `PAID`, `CONFIRMED`, `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`), `OrderCancellationPolicy`

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#11-pedidos)):
- **Trava Biológica Inviolável:** Antes de criar qualquer pedido, o `CreateOrderUseCase` invoca o `AllergenEngine` para todos os produtos selecionados contra o `FoodProfile` ativo do consumidor. Se qualquer produto tiver risco `BLOCKED` ou `DANGER`, o pedido é sumariamente abortado (*Fail-Safe*).
- **Consistência de Estabelecimento:** Todos os itens do pedido devem pertencer estritamente ao mesmo parceiro comercial.
- **Ciclo de Vida do Pedido:** Transições estritas permitidas apenas para frente (`CREATED` ➔ `AWAITING_PAYMENT` ➔ `PAID` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY_FOR_PICKUP`/`OUT_FOR_DELIVERY` ➔ `DELIVERED`).
- **Política de Cancelamento e Reembolso:** Cancelamentos solicitados antes do parceiro iniciar o preparo (`CONFIRMED`/`PREPARING`) concedem reembolso integral e automático ao consumidor (`isRefundEligible = true`). Se o parceiro já começou a preparar ou despachou, o cancelamento direto pelo cliente é rejeitado.

## Testes

- `backend/tests/unit/domain/order/Order.spec.ts`
- `backend/tests/unit/application/order/CreateOrderUseCase.spec.ts`
- `backend/tests/unit/application/order/OrderUseCases.spec.ts`
