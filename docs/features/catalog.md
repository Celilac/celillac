# Catálogo de Produtos

**Status:** ✅ Implementado
**Entregue em:** 2026-07-01 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#2-catálogo-de-produtos-e-parceiros)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/products` | Cadastrar produto |
| `GET`  | `/products` | Buscar produtos |

## Domínio

- `Product` aggregate root
- `AnalysisStatus`: `PENDENTE_DE_ANALISE` | `ANALISADO`

**Regras críticas:**
- Produto sem ingredientes declarados entra como `PENDENTE_DE_ANALISE`
- `crossContamination` é obrigatório (pode ser string vazia, nunca `undefined`/`null`)

## Testes

`backend/tests/unit/domain/catalog/Product.spec.ts`
`backend/tests/unit/application/catalog/{CreateProductUseCase,SearchProductsUseCase}.spec.ts`
