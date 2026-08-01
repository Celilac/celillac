# Perfil Alimentar

**Status:** ✅ Implementado
**Entregue em:** 2026-06-30, atualizado em 2026-07-28 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#3-perfil-alimentar)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#1-perfil-alimentar)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/food-profile` | Criar perfil alimentar inicial |
| `GET`  | `/food-profile/:userId` | Buscar perfil por usuário |
| `PUT`  | `/food-profile/:userId` | Atualizar restrições e tolerância a contaminação cruzada |

## Domínio

- `FoodProfile` aggregate root com suporte a `acceptsCrossContamination`
- `Restriction` entity (alérgeno + severidade + tipo + notas)
- `SeverityLevel`: `LOW` | `MEDIUM` | `HIGH` | `FATAL` | `LIFESTYLE`
- `RestrictionType`: `ALLERGY` | `INTOLERANCE` | `MEDICAL_RESTRICTION` | `DIETARY_PREFERENCE` | `LIFESTYLE`
- `AllergenType`: Glúten, Lactose, Castanhas, Soja, Ovos, Frutos do Mar, Peixes, Gergelim, Outro

**Regras críticas** (detalhadas em [`DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#1-perfil-alimentar)):
- Perfil ativo exige ≥1 restrição
- Restrições `FATAL` sinalizam revalidação histórica
- Anti-duplicidade de alérgenos
- `acceptsCrossContamination` (falso por padrão p/ celíacos e alérgicos severos)

## Testes

- `backend/tests/unit/domain/food-profile/{SeverityLevel,Restriction,FoodProfile}.spec.ts`
- `backend/tests/unit/application/food-profile/UpdateFoodProfileUseCase.spec.ts`
