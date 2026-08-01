# Consumidor (Consumer)

**Status:** ✅ Implementado
**Entregue em:** 2026-07-27, atualizado em 2026-08-01 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#11-consumidor-consumer)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#10-consumidor)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `GET`    | `/consumer/me` | Buscar perfil consolidado do consumidor logado (auto-criação graciosa) |
| `PUT`    | `/consumer/preferences` | Atualizar preferências gerais de interface (JSONB) |
| `POST`   | `/consumer/restrictions` | Adicionar nova restrição alimentar ao perfil |
| `DELETE` | `/consumer/restrictions/:allergen` | Remover uma restrição alimentar do perfil por alérgeno |

## Domínio

- Aggregate Root `Consumer` (`id`, `userId`, `generalPreferences`, `profileEvaluationStatus`, `hasIncompleteProfileWarning`)
- Entidade `FoodProfile` com restrições alimentares associadas
- `ConsumerStatus`: `ACTIVE` | `SUSPENDED` | `BLOCKED`

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#10-consumidor)):
- Instanciação centralizada e idempotente via `CreateConsumerUseCase`.
- Todo Consumidor possui vínculo estrito com `userId` do IAM.
- Alerta automático de `hasIncompleteProfileWarning = true` caso o usuário não possua restrições alimentares ativas.

## Testes

- `backend/tests/unit/domain/consumer/Consumer.spec.ts`
- `backend/tests/unit/application/consumer/CreateConsumerUseCase.spec.ts`
- `backend/tests/unit/application/consumer/GetConsumerProfileUseCase.spec.ts`
