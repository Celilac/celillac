# Catálogo e Gestão de Parceiros Comerciais (Partners)

**Status:** ✅ Implementado
**Entregue em:** 2026-07-17, atualizado em 2026-08-28 (FEAT-066 / Issue — Reorganizar cadastro de estabelecimento em duas colunas e adicionar marca do estabelecimento - ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#7-gestão-de-parceiros-partners)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/partners` | Cadastrar novo estabelecimento comercial (suporta `logoUrl`) |
| `GET`  | `/partners` | Listagem pública de estabelecimentos homologados e ativos |
| `GET`  | `/partners/:id` | Detalhes de um estabelecimento específico |
| `GET`  | `/partners/me/all` | Listar todos os estabelecimentos do usuário parceiro autenticado |
| `PUT`  | `/partners/:id` | Atualizar dados do estabelecimento (suporta `logoUrl`) |
| `POST` | `/partners/:id/submit` | Submeter estabelecimento para revisão administrativa |
| `PATCH`| `/partners/:id/operational-status` | Alternar status operacional (`ACTIVE`, `TEMPORARILY_CLOSED`, `INACTIVE`) |
| `GET`  | `/admin/partners` | Listar estabelecimentos para moderação administrativa |
| `POST` | `/admin/partners/:id/approve` | Aprovar cadastro de parceiro |
| `POST` | `/admin/partners/:id/reject` | Rejeitar cadastro com justificativa |
| `POST` | `/admin/partners/:id/suspend` | Suspender parceiro com justificativa |
| `POST` | `/admin/partners/:id/reactivate` | Reativar parceiro suspenso |

## Domínio

- `Partner` (Entidade raiz do Bounded Context de Catálogo de Parceiros)
- `PartnerType`: `RESTAURANT` | `MARKET` | `INDEPENDENT_PRODUCER`
- `PartnerApprovalStatus`: `DRAFT` | `PENDING_REVIEW` | `APPROVED` | `REJECTED` | `SUSPENDED`
- `PartnerOperationalStatus`: `ACTIVE` | `INACTIVE` | `TEMPORARILY_CLOSED`
- `logoUrl`: Identidade visual / Marca do estabelecimento (otimizada em WebP/JPEG, preservada com `contain`)

**Regras críticas:**
- Alterações em campos críticos (`name`, `type`, `cnpj`, `address`, `phone`, `city`, `state`) em estabelecimentos aprovados regridem o status para `PENDING_REVIEW`.
- Alterações em `description` e `logoUrl` são não-críticas e preservam o status `APPROVED`.
- Parceiros suspensos não podem ter seu status operacional alterado antes da reativação.
- Estabelecimentos só aparecem na listagem pública quando aprovados pela governança e não suspensos.

## Testes

- `backend/tests/unit/domain/partner/Partner.spec.ts`
- `backend/tests/unit/application/partner/RegisterPartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/UpdatePartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/GetPartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListUserPartnersUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListPublicPartnersUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListAdminPartnersUseCase.spec.ts`
