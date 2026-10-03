# Documento de Entrega — Fase 1: Expansão do Cadastro de Produtos & Nova Arquitetura de Interface

**Documento de Referência:** [`PRDs/Feedback_Cadastro_Produtos_CeliLac.md`](file:///c:/Users/triches/Documents/CeLiLac/celillac/PRDs/Feedback_Cadastro_Produtos_CeliLac.md)  
**Branch de Trabalho:** `feat/product-registration-redesign`  
**Data:** 10 de Setembro de 2026  
**Status:** ✅ Concluído e Validado (Testes & Builds 100% Verdes)

---

## 1. Visão Geral e Contexto da Entrega

A tela de cadastro de produtos original (`CreateProductModal.tsx`) operava como um MVP simples em formato de modal pop-up estreito (~620px), centrado exclusivamente em um switch binário *"Contém Glúten? Sim/Não"*, sem dados de pesagem/medida, sem rastreabilidade de origem comercial (fabricação própria vs revenda), sem suporte a rascunhos e sem campos para traços declarados de alérgenos.

A **Fase 1** teve como missão resolver essas deficiências estruturais tanto no backend quanto no frontend, implementando a fundação de dados, as regras de validação progressiva e uma interface moderna em 2 colunas no Desktop e Wizard no Mobile.

---

## 2. O que foi Desenvolvido e Implementado

### 2.1 Banco de Dados (PostgreSQL)

Foi criada uma nova migration segura e idempotente:
📁 [`harness/scripts/migrations/021_extend_product_identification_and_composition.sql`](file:///c:/Users/triches/Documents/CeLiLac/celillac/harness/scripts/migrations/021_extend_product_identification_and_composition.sql)

```sql
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS net_content NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS unit_of_measure VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ean VARCHAR(14),
  ADD COLUMN IF NOT EXISTS commercial_origin VARCHAR(50) NOT NULL DEFAULT 'OWN_MANUFACTURE',
  ADD COLUMN IF NOT EXISTS may_contain_traces TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS composition_notes TEXT,
  ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50) NOT NULL DEFAULT 'PUBLISHED';

CREATE INDEX IF NOT EXISTS idx_products_publication_status ON products(publication_status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_ean ON products(ean);
CREATE INDEX IF NOT EXISTS idx_products_commercial_origin ON products(commercial_origin);
```

#### Destaques de Banco de Dados:
- **Zero Breaking Changes:** Todas as colunas possuem valores `DEFAULT` ou são `NULLABLE`, mantendo integridade absoluta com os registros já existentes.
- **Sincronização Automática:** Atualizada a rotina em [`backend/src/infrastructure/database/connection.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/infrastructure/database/connection.ts) para auto-aplicação nos ambientes de desenvolvimento.
- **Documentação Atualizada:** Tabela `products` atualizada em [`docs/DATABASE.md`](file:///c:/Users/triches/Documents/CeLiLac/celillac/docs/DATABASE.md).

---

### 2.2 Camada de Domínio & Regras de Negócio (DDD)

Arquivo: [`backend/src/domain/catalog/Product.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/domain/catalog/Product.ts)

#### Novos Tipos e Estados:
- `CommercialOrigin`: `'OWN_MANUFACTURE'` (Fabricação Própria) | `'THIRD_PARTY_RESELL'` (Revenda / Fornecido por Terceiro).
- `PublicationStatus`: `'DRAFT'` (Rascunho) | `'PUBLISHED'` (Publicado) | `'INACTIVE'` (Inativo).

#### Regras Críticas de Domínio:
1. **Diferenciação de Ciclo de Vida (Rascunho vs Publicado):**
   - Se `publicationStatus === 'DRAFT'`, permite criar o produto com dados preliminares para que o parceiro preencha a ficha técnica progressivamente sem perder progresso.
   - Se `publicationStatus === 'PUBLISHED'`, a lista completa de ingredientes e declarações sanitárias tornam-se estritamente obrigatórias.
2. **Validação Sanitária e Precaução:**
   - Preços (`price`) e pesos/volumes (`netContent`) não podem ser negativos.
   - Se código de barras (`ean`) for informado, deve conter entre 8 e 14 dígitos numéricos válidos.
   - Métodos de ciclo de vida: `publish(): Result<void>`, `saveAsDraft(): void`, `inactivate(): void` e `activate(): void`.

---

### 2.3 Casos de Uso, Repositório e Controladores HTTP

1. **Repositório PostgreSQL:**
   - [`backend/src/infrastructure/database/catalog/PgProductCatalogRepository.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/infrastructure/database/catalog/PgProductCatalogRepository.ts): Atualizado para persistir, mapear e pesquisar as novas colunas, incluindo busca por `sku` e checagem de alérgenos excluídos no campo `may_contain_traces`.
2. **Casos de Uso da Aplicação:**
   - [`backend/src/application/catalog/CreateProductUseCase.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/application/catalog/CreateProductUseCase.ts): DTOs expandidos, validação de capacidade de publicação do parceiro e controle de transição de status.
   - [`backend/src/application/catalog/UpdateProductUseCase.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/application/catalog/UpdateProductUseCase.ts): Atualização granular preservando dados existentes.
3. **Controllers HTTP & Contratos:**
   - [`backend/src/interfaces/http/controllers/catalog/CreateProductController.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/interfaces/http/controllers/catalog/CreateProductController.ts)
   - [`backend/src/interfaces/http/controllers/catalog/UpdateProductController.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/backend/src/interfaces/http/controllers/catalog/UpdateProductController.ts)
   - [`docs/API_CONTRACTS.md`](file:///c:/Users/triches/Documents/CeLiLac/celillac/docs/API_CONTRACTS.md): Contrato formal da rota `POST /catalog/products` atualizado.

---

### 2.4 Frontend Web App (`frontend/web-app`)

1. **Cliente de API Tipado:**
   - [`frontend/web-app/src/api/catalog.ts`](file:///c:/Users/triches/Documents/CeLiLac/celillac/frontend/web-app/src/api/catalog.ts): Adicionados os tipos `CommercialOrigin`, `PublicationStatus` e novos campos em `CreateProductInput`, `ProductSummary` e `ProductDetails`.
2. **Redesenho Completo da Interface do Modal:**
   - [`frontend/web-app/src/components/common/CreateProductModal.tsx`](file:///c:/Users/triches/Documents/CeLiLac/celillac/frontend/web-app/src/components/common/CreateProductModal.tsx)

#### Principais Inovações de Interface e UX:
- **Layout de 2 Colunas no Desktop (~1100px):**
  - **Coluna Principal (65%):**
    - **Origem Comercial:** Cards visuais clicáveis com ícones e explicações (`🏭 Fabricação Própria` vs `📦 Revenda de Terceiro`).
    - **Identificação Completa:** Nome, Marca, Categoria (com registro inline e moderação), Preço, Peso Líquido + Seletor de Unidades (`g`, `kg`, `ml`, `L`, `un`), Descrição curta, SKU e EAN.
    - **Ingredientes & Rótulo:** Textarea amplo para ingredientes conforme rótulo e **campo destacado âmbar para "Pode Conter..." (RDC 727/2022 ANVISA)** com notas técnicas de composição.
    - **Segurança Alimentar (Fase 1):** Switch/Botão de Glúten, Seletor de 3 estados para Leite/Derivados (APLV/Lactose) e Seletor de Risco de Contaminação Cruzada de ambiente em português.
  - **Coluna Lateral de Apoio (35%):**
    - **Card de Ações de Publicação:** Botões destacados *"🚀 Publicar no Catálogo"* (com validação completa) e *"💾 Salvar como Rascunho"* (permite dados parciais).
    - **Card de Live Preview:** Simula em tempo real como o produto e suas badges de segurança alimentar serão vistos pelos consumidores celíacos no catálogo.
    - **Card de Imagem & Rótulo:** Input para URL da foto principal e aviso educativo sobre a Galeria Funcional da Fase 2.
- **Wizard Responsivo no Mobile (< 820px):**
  - Barra de etapas sequenciais: `1. Identificação` ➔ `2. Ingredientes & Traços` ➔ `3. Segurança Alimentar` ➔ `4. Revisão & Publicação`, eliminando o problema de scroll vertical interminável em celulares.
- **Prevenção de Perda de Dados (Auto-save Local):**
  - O modal salva automaticamente as alterações no `localStorage` a cada edição. Ao fechar acidentalmente e reabrir, os dados são preservados com opção de descarte limpo.

---

## 3. Validação e Qualidade

### 3.1 Testes Automatizados no Backend (Jest)
Execução da suíte completa de testes unitários do catálogo:
```bash
npm test -- tests/unit/domain/catalog tests/unit/application/catalog
```
- **Suítes de Teste:** 8 aprovadas de 8 (100%)
- **Testes Individuais:** 42 testes aprovados de 42
- **Destaques:** Testes de criação com novos campos, validação de EAN, restrição de peso negativo, comportamento de rascunho vs publicação sem ingredientes.

### 3.2 Compilação e Build
- **Backend (TypeScript):** `npm run build` executado com **Exit code 0** via `tsc -p tsconfig.build.json`.
- **Frontend (Next.js 14):** `npm run build` executado com **Exit code 0** gerando as 18 rotas de produção otimizadas.

---

## 4. Próximas Fases Planejadas

Conforme a estratégia traçada a partir do `Feedback_Cadastro_Produtos_CeliLac.md`:

| Fase | Escopo Principal | Status |
| :--- | :--- | :--- |
| **Fase 1** | Expansão de identificação, origem comercial, peso/unidade, campo "pode conter", rascunhos e UI em 2 colunas | ✅ **Entregue** |
| **Fase 2** | Galeria de Imagens Funcionais (upload multi-fotos, drag & drop, classificação: rótulo, embalagem, tabela nutricional, selos) | ⏳ **Próxima** |
| **Fase 3** | Matriz Multidimensional de Alérgenos (4 estados semânticos por restrição) e Contaminação Cruzada granular por alérgeno | 📋 Planejada |
| **Fase 4** | Certificações & Evidências Formais (laudos técnicos, selos ACELBRA/orgânico) e integração profunda com `AllergenEngine` | 📋 Planejada |
