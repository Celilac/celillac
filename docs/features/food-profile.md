# Perfil Alimentar

**Status:** ✅ Implementado
**Entregue em:** 2026-06-30, atualizado em 2026-07-01 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#3-perfil-alimentar)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#1-perfil-alimentar)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/food-profile` | Criar perfil alimentar |
| `GET`  | `/food-profile/:userId` | Buscar perfil por usuário |
| `PUT`  | `/food-profile/:userId` | Atualizar restrições do perfil |

## Domínio

- `FoodProfile` aggregate root
- `Restriction` entity (alérgeno + severidade)
- `SeverityLevel`: `LOW` | `MEDIUM` | `HIGH` | `FATAL`
- `AllergenType`: Glúten, Lactose, Castanhas, Soja, Ovos, Frutos do Mar, Peixes, Gergelim, Outro

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#1-perfil-alimentar)):
- Perfil ativo exige ≥1 restrição
- Restrições `FATAL` sinalizam revalidação histórica
- Anti-duplicidade de alérgenos

## Testes

`backend/tests/unit/domain/food-profile/{SeverityLevel,Restriction,FoodProfile}.spec.ts`
`backend/tests/unit/application/food-profile/UpdateFoodProfileUseCase.spec.ts`
