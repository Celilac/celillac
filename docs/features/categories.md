# Categorias de Produtos e Moderação

**Status:** ✅ Implementado
**Entregue em:** 2026-08-28 (FEAT-067 - ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#5-catálogo-de-produtos)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/catalog/categories` | Cadastrar nova categoria pelo estabelecimento parceiro |
| `GET`  | `/catalog/categories` | Listar categorias disponíveis (públicas ou por `partnerId`) |
| `GET`  | `/admin/categories` | Listar categorias com filtros para moderação administrativa |
| `PATCH`| `/admin/categories/:id/review` | Moderação (Aprovar como Global, Aprovar como Restrita ou Rejeitar) |

## Domínio

- `Category` (Entidade de Domínio no Contexto de Catálogo)
- `CategoryStatus`: `PENDING_APPROVAL` | `APPROVED` | `REJECTED`
- `CategoryVisibility`: `GLOBAL` | `RESTRICTED`

**Regras críticas:**
- O estabelecimento parceiro pode registrar novas categorias sob demanda no modal de publicação de produtos.
- Categorias registradas por parceiros nascem como `PENDING_APPROVAL` e `RESTRICTED`.
- O parceiro pode utilizar imediatamente a categoria para vincular seus produtos.
- Enquanto estiver no status `PENDING_APPROVAL`, a categoria **não aparece publicamente** para consumidores/clientes nos filtros de busca do catálogo.
- A administração pode aprovar a categoria tornando-a pública (`GLOBAL`) para todos os estabelecimentos e clientes, ou aprová-la como restrita (`RESTRICTED`) para o parceiro que a criou.

## Testes

- `backend/tests/unit/domain/catalog/Category.spec.ts`
- `backend/tests/unit/application/catalog/CreateCategoryUseCase.spec.ts`
- `backend/tests/unit/application/admin/ReviewCategoryUseCase.spec.ts`
