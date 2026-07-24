# Catálogo de Produtos

**Status:** ✅ Implementado
**Entregue em:** 2026-07-01 (Última atualização: 2026-07-18 - ver [CHANGELOG.md](../../CHANGELOG.md))
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#2-catálogo-de-produtos-e-parceiros)

## Endpoints

| Método | Rota | Autenticação | Descrição |
|:-------|:-----|:------------:|:----------|
| `POST` | `/catalog/products` | Sim | Cadastrar novo produto no catálogo (Restrito a parceiros ativos) |
| `GET`  | `/catalog/products` | Opcional | Buscar produtos por termo/alérgenos a evitar |
| `GET`  | `/catalog/products/:id` | Opcional | Obter ficha técnica detalhada de um produto individual |
| `PUT`  | `/catalog/products/:id` | Sim | Editar ficha técnica do produto (Restrito ao parceiro dono) |
| `PATCH`| `/catalog/products/:id/status` | Sim | Ativar ou inativar produto (Restrito ao parceiro dono) |

## Domínio

- `Product` aggregate root
- `AnalysisStatus`: `PENDENTE_DE_ANALISE` | `ANALISADO`
- `isActive` boolean (controle de exclusão lógica/indisponibilidade)

**Regras críticas:**
- Produto sem ingredientes declarados entra como `PENDENTE_DE_ANALISE`
- `crossContamination` é obrigatório (pode ser string vazia, nunca `undefined`/`null`)
- Parceiros só podem cadastrar produtos se estiverem com conta ativa.
- Parceiros só podem editar ou inativar seus próprios produtos.
- Produtos inativos são omitidos das buscas públicas gerais.

## Testes

- `backend/tests/unit/domain/catalog/Product.spec.ts`
- `backend/tests/unit/application/catalog/{CreateProductUseCase,SearchProductsUseCase,GetProductUseCase,UpdateProductUseCase,InactivateProductUseCase}.spec.ts`
