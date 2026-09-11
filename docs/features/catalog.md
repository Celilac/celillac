# Catálogo de Produtos

**Status:** ✅ Implementado (Fase 1: Expansão Cadastral e Composição; Fase 2: Galeria de Imagens Funcionais; Fase 3: Segurança Alimentar Avançada, Estilos e Selos; Fase 4: Integração AllergenEngine e Moderação de Laudos)
**Entregue em:** 2026-07-01 (Última atualização: 2026-09-10 - ver [CHANGELOG.md](../../CHANGELOG.md))
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md#2-catálogo-de-produtos-e-parceiros)

## Endpoints

| Método | Rota | Autenticação | Descrição |
|:-------|:-----|:------------:|:----------|
| `POST` | `/catalog/products` | Sim | Cadastrar ou salvar rascunho de produto com galeria, matriz de alérgenos e selos (Restrito a parceiros ativos) |
| `GET`  | `/catalog/products` | Opcional | Buscar produtos por termo/alérgenos a evitar |
| `GET`  | `/catalog/products/:id` | Opcional | Obter ficha técnica detalhada de um produto individual |
| `PUT`  | `/catalog/products/:id` | Sim | Editar ficha técnica do produto (Restrito ao parceiro dono) |
| `PATCH`| `/catalog/products/:id/status` | Sim | Ativar ou inativar produto (Restrito ao parceiro dono) |

## Domínio

- `Product` Aggregate Root
- `ProductImage` Entity (Galeria funcional até 8 fotos com tipos: `PRODUCT`, `PACKAGING`, `LABEL`, `INGREDIENTS`, `NUTRITIONAL_INFO`, `CERTIFICATION`)
- `ProductCertification` Entity (Selos e certificações oficiais auditadas ou declaradas: ACELBRA, SVB Vegano, Orgânico Brasil, Laudos < 20ppm)
- `AllergenPresence` Value Object (`FREE`, `CONTAINS`, `TRACES`, `NOT_INFORMED`)
- `DietaryFeature` Value Object (`VEGAN`, `VEGETARIAN`, `NO_ADDED_SUGAR`, `SUGAR_FREE`, `ORGANIC`, `KOSHER`, `HALAL`)
- `InformationOrigin` Value Object (`PARTNER_DECLARED`, `VERIFIED_BY_CELILAC`)
- `NutritionalInfo` Value Object / Interface (Porção, calorias, carboidratos, açúcares totais e adicionados, proteínas, gorduras, fibras, sódio)
- `AnalysisStatus`: `PENDENTE_DE_ANALISE` | `ANALISADO`
- `CommercialOrigin`: `OWN_MANUFACTURE` (Fabricação Própria) | `THIRD_PARTY_RESELL` (Revenda de Terceiro)
- `PublicationStatus`: `DRAFT` | `PUBLISHED` | `INACTIVE`
- `isActive` boolean (controle de exclusão lógica/indisponibilidade)
- Identificadores e medidas: `netContent`, `unitOfMeasure` (g, kg, ml, L, un), `sku`, `ean` (código de barras de 8 a 14 dígitos)
- Composição detalhada: `ingredients`, `mayContainTraces` (declaração preventiva "Pode Conter" RDC 727/2022), `compositionNotes`

**Regras críticas:**
- Produto sem ingredientes declarados entra como `PENDENTE_DE_ANALISE`
- Se `publicationStatus === 'PUBLISHED'`, a lista de ingredientes é obrigatória
- Se `publicationStatus === 'DRAFT'`, permite dados parciais para preenchimento progressivo
- Sincronização automática entre matriz de alérgenos (`declaredAllergens['GLUTEN']`) e a flag `hasGluten` do catálogo
- `crossContamination` é obrigatório para publicação (pode ser string vazia, nunca `undefined`/`null`)
- `netContent` e `price` não podem ser negativos
- Se `ean` for informado, deve conter entre 8 e 14 dígitos numéricos
- Imagem de capa sincroniza com `imageUrl` legado para preservar compatibilidade total com apps existentes
- Parceiros só podem cadastrar produtos se estiverem com conta ativa e aprovada.
- Parceiros só podem editar ou inativar seus próprios produtos.
- Produtos inativos são omitidos das buscas públicas gerais.

## Testes

- `backend/tests/unit/domain/catalog/Product.spec.ts`
- `backend/tests/unit/domain/catalog/ProductImage.spec.ts`
- `backend/tests/unit/domain/catalog/ProductCertification.spec.ts`
- `backend/tests/unit/application/catalog/{CreateProductUseCase,SearchProductsUseCase,GetProductUseCase,UpdateProductUseCase,InactivateProductUseCase}.spec.ts`

