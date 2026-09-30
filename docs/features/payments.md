# Pagamentos e Split Marketplace (Payments)

**Status:** ✅ Implementado
**Entregue em:** 2026-09-30 (FEAT-094 - ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#15-pagamentos-e-split-marketplace-payments)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#12-pagamentos)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/payments/checkout` | Processamento de checkout para um pedido via PIX (QR Code e Copia-e-Cola) ou Cartão de Crédito |
| `GET`  | `/payments/order/:orderId` | Consulta do status de pagamento de um pedido com payload PIX e detalhes da transação |
| `POST` | `/partner/:partnerId/financial-account` | Configuração da subconta bancária / chave PIX do estabelecimento parceiro para recebimento de repasses |
| `GET`  | `/partner/:partnerId/financial-account` | Consulta dos dados da conta financeira e chave PIX cadastrada do parceiro |
| `POST` | `/payments/webhook/asaas` | Webhook público para receber confirmação de pagamento (`PAYMENT_RECEIVED`) e estorno (`PAYMENT_REFUNDED`) da Asaas |

## Domínio

- **Aggregate Root:** `Payment` (`id`, `orderId`, `gatewayPaymentId`, `method`, `status`, `amount`, `platformFee`, `netPartnerAmount`, `pixQrCodeUrl`, `pixCopyPaste`, `paidAt`, `createdAt`, `updatedAt`)
- **Entities:** `PartnerFinancialAccount` (`id`, `partnerId`, `asaasAccountId`, `pixKeyType`, `pixKey`, `isVerified`, `createdAt`), `PaymentRefund` (`id`, `paymentId`, `amount`, `reason`, `gatewayRefundId`, `createdAt`)
- **Value Objects:** `PaymentMethod` (`PIX`, `CREDIT_CARD`), `PaymentStatus` (`PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`), `SplitCalculator`
- **Gateway Port & Adapter:** `IPaymentGateway` (Port), `AsaasPaymentGateway` (Adapter com fallback seguro para dev/test)

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#12-pagamentos)):
- **Modelo de Split Marketplace (Padrão iFood):**
  - Comissão da plataforma CeLiLac: 12% calculada sobre o valor dos produtos/itens.
  - Taxa de processamento gateway (R$ 1,99 no PIX ou equivalente).
  - Taxa de entrega repassada integralmente ao parceiro/entregador.
  - O valor líquido restante (`netPartnerAmount`) é creditado diretamente na subconta Asaas do parceiro comercial.
- **Idempotência no Checkout:** Se um checkout for requisitado para um pedido já pago, a operação retorna status `PAID` sem criar nova cobrança. Se o checkout já foi gerado e está pendente, o QR Code existente é retornado.
- **Webhook e Transição Automática de Pedido:** Ao receber evento `PAYMENT_RECEIVED` ou `PAYMENT_CONFIRMED` via webhook da Asaas, o status do pagamento é atualizado para `PAID` e o status do pedido correspondente é automaticamente promovido para `PAID`.
- **Reembolso Automático:** Quando um pedido elegível a reembolso é cancelado, o `RefundPaymentUseCase` é acionado para solicitar o estorno integral via gateway e registrar a entidade `PaymentRefund`.

## Testes

- `backend/tests/unit/domain/payment/Payment.spec.ts`
- `backend/tests/unit/application/payment/PaymentUseCases.spec.ts`
