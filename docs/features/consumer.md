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
| `PATCH`  | `/consumer/status` | Alternar status de participação (`ACTIVATE` / `DEACTIVATE`) com auditoria |
| `POST`   | `/consumer/restrictions` | Adicionar nova restrição alimentar ao perfil |
| `DELETE` | `/consumer/restrictions/:allergen` | Remover uma restrição alimentar do perfil por alérgeno |

## Domínio

- Aggregate Root `Consumer` (`id`, `userId`, `generalPreferences`, `profileEvaluationStatus`, `hasIncompleteProfileWarning`, `statusChangedAt`, `statusChangedBy`, `statusChangeReason`)
- Entidade `FoodProfile` com restrições alimentares associadas
- `ConsumerStatus`: `CONTA_CRIADA` | `PERFIL_INCOMPLETO` | `PERFIL_CONFIGURADO` | `PERFIL_CRITICO` | `ATIVO` | `INATIVO`

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#10-consumidor)):
- Instanciação centralizada e idempotente via `CreateConsumerUseCase`.
- Rastreabilidade de auditoria de alterações de status (`status_changed_at`, `status_changed_by`, `status_change_reason`).
- A desativação (`INATIVO`) não impede o login do usuário no IAM, permitindo reativação a qualquer momento via `/profile`.
- Sincronização automática de status quando o perfil alimentar é criado ou atualizado.

## Testes

- `backend/tests/unit/domain/consumer/Consumer.spec.ts`
- `backend/tests/unit/application/consumer/CreateConsumerUseCase.spec.ts`
- `backend/tests/unit/application/consumer/GetConsumerProfileUseCase.spec.ts`
- `backend/tests/unit/application/consumer/ToggleConsumerStatusUseCase.spec.ts`
