# Pagamento na Entrega e Proteção Contra Fraude do Consumidor

**Status:** ✅ Implementado  
**Entregue em:** 2026-10-01  
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#14-pedidos-orders) e [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#15-pagamentos-e-split-marketplace-payments)  
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/payments/checkout` | Suporta `method: CASH_ON_DELIVERY` (com `changeFor` opcional) e `CARD_ON_DELIVERY`. Valida elegibilidade do consumidor. |
| `POST` | `/orders/:id/report-non-payment` | Parceiro reporta recusa de pagamento ou ausência do consumidor, cancela pedido, zera taxa da plataforma e revoga pagamentos na entrega do cliente. |

## Domínio

- **`PaymentMethod`**: `CASH_ON_DELIVERY` e `CARD_ON_DELIVERY`.
- **`Payment` Entity**:
  - `changeFor`: Valor para cálculo e conferência de troco pelo entregador.
  - `waivePlatformFee()`: Zera a comissão retida pelo CeLiLac (`platformFee = 0`, `netPartnerAmount = totalAmount`) para proteger o restaurante contra prejuízos em pedidos fraudulentos ou não pagos.
- **`Consumer` Entity**:
  - `canPayOnDelivery`: Flag booleana que indica se o consumidor pode selecionar pagamento presencial.
  - `revokePayOnDelivery(reason)`: Bloqueia pagamento na entrega em caso de denúncia de não pagamento ou ausência.
  - `restorePayOnDelivery()`: Permite restauração via moderação administrativa.
- **`Report` Entity & `ReportReason`**:
  - Suporte a `CLIENT_REFUSED_PAYMENT`, `CLIENT_ABSENT`, `FRAUDULENT_ORDER` associados ao `targetUserId` e `orderId`.
- **`Order` Entity**:
  - Suporte a confirmação direta de pedidos na entrega (`confirmDeliveryOrder()`) sem depender de webhook de liquidação prévia.
  - Mapeamento de `paymentMethod` e `changeFor` na recuperação pelo repositório.

## Regras Críticas

1. **Proteção Financeira do Parceiro:** Se um pedido na entrega for denunciado por recusa de pagamento ou ausência, o pedido é cancelado (`CANCELLED`), o pagamento marcado como falhado (`FAILED`) e a comissão da plataforma (12%) é estornada/zerada.
2. **Auditoria Obrigatória do Administrador:** Ao ser denunciado pelo estabelecimento, o caso é registrado na fila de auditoria com status `PENDING`. O bloqueio do consumidor para pagamentos presenciais (`canPayOnDelivery = false`) não é automático: ele só ocorre se o Administrador avaliar as circunstâncias, averiguar a declaração da loja e aceitar formalmente a denúncia (`RESOLVED`) no painel `/admin/reports`. Se a denúncia for julgada improcedente ou justificada e for descartada (`DISMISSED`), o consumidor permanece livre de restrições (e qualquer bloqueio prévio é restaurado).
3. **Auditoria e Notificações:** Toda ocorrência e parecer da moderação é registrado no histórico permanente de auditoria (`audit_logs`) e no log de segurança (`ORDER_PAYMENT_REFUSED_ON_DELIVERY`), além de propagar notificações SSE para atualização em tempo real.

## Testes

- `backend/tests/unit/application/order/ReportOrderNonPaymentUseCase.spec.ts`
- `backend/tests/unit/application/payment/PaymentUseCases.spec.ts`
- `backend/tests/unit/domain/consumer/Consumer.spec.ts`
- `backend/tests/unit/domain/payment/Payment.spec.ts`
