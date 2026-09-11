# Fase 2: Galeria Funcional de Imagens e Classificação de Rótulos

> **Contexto:** Evolução do Cadastro e Ficha Técnica de Produtos CeLiLac  
> **Branch:** `feat/product-registration-redesign`  
> **Data:** 10/09/2026  
> **Status:** Concluído com 100% de Testes e Builds Aprovados  

---

## 1. Visão Geral da Fase 2

A **Fase 2** resolve uma das principais lacunas apontadas na análise de produto (`PRDs/Feedback_Cadastro_Produtos_CeliLac.md`): a necessidade de comprovação fotográfica e visual das alegações de segurança alimentar (rotulagem, embalagem e tabela nutricional).

Em vez de um campo isolado de texto para uma única URL de imagem comercial, foi implementado um **sistema completo de galeria visual**, que permite ao estabelecimento produtor/fornecedor anexar até **8 fotografias categorizadas**, definir a imagem de capa principal, reordenar a exibição e fornecer legibilidade total aos rótulos e declarações de alérgenos da RDC 727/2022 da ANVISA.

---

## 2. O que Foi Desenvolvido

### 2.1. Banco de Dados & Infraestrutura
- **Tabela Relacional `product_images`:**
  - `id (UUID)`: Chave primária.
  - `product_id (UUID)`: Chave estrangeira com `ON DELETE CASCADE` referenciando `products(id)`.
  - `url (TEXT)`: URL externa ou Data URL (Base64 WebP/JPEG comprimido).
  - `image_type (VARCHAR(30))`: Classificação em 6 tipos estruturados.
  - `caption (VARCHAR(255))`: Legenda opcional descritiva.
  - `display_order (INTEGER)`: Posição de ordenação na galeria (0 a 7).
  - `is_cover (BOOLEAN)`: Flag de imagem de capa principal para listagens e buscas.
  - `created_at` e `updated_at`: Timestamps automáticos.
- **Migration `022_create_product_images_table.sql`:** Criada em `harness/scripts/migrations/` com índices em `product_id` e `(product_id, is_cover)`.
- **Auto-Sync Idempotente em `connection.ts`:** DDL sincronizado no backend.
- **Ampliação do Body Parser Express (`backend/src/index.ts`):** Limite de requisição expandido para **25 MB**, comportando uploads de celulares modernos sem estourar o buffer do servidor.

### 2.2. Domínio & Regras de Negócio (Clean Architecture)
- **Entidade `ProductImage` (`backend/src/domain/catalog/ProductImage.ts`):**
  - Validação estrita de URL (suporta HTTPS/HTTP e Data URLs).
  - Validação dos 6 tipos permitidos:
    1. `PRODUCT`: Foto do produto pronto/consumo.
    2. `PACKAGING`: Foto da embalagem fechada/comercial.
    3. `LABEL`: Rótulo frontal legível.
    4. `INGREDIENTS`: Lista de ingredientes ampliada (RDC 727/2022).
    5. `NUTRITIONAL_INFO`: Tabela nutricional do fabricante.
    6. `CERTIFICATION`: Selos, laudos laboratoriais e certificações sem glúten.
  - Métodos de domínio: `markAsCover()`, `unmarkCover()`, `updateOrder()`, `updateCaption()`.
- **Entidade `Product` (`backend/src/domain/catalog/Product.ts`):**
  - Incorporação da coleção `images: ProductImage[]`.
  - Getter `coverImage`: Retorna a imagem marcada como `isCover === true` (ou fallback seguro para a primeira foto).
  - **Sincronização Bidirecional com `imageUrl`:** Sempre mantém o campo legado `imageUrl` atualizado com a imagem de capa, garantindo 100% de compatibilidade com o app mobile Flutter, tela de favoritos e buscas públicas existentes.
- **Repositório `PgProductCatalogRepository`:**
  - Persistência transacional atômica de fotos ao criar (`create`) e atualizar (`update`).
  - Cascata de inserção e exclusão de fotos antigas sem orfãos.
  - Carregamento de imagens em `findById` e consultas do catálogo.

### 2.3. Frontend & Experiência Impecável (Web App)
- **Otimização de Imagens para Celulares (`frontend/web-app/src/utils/image.ts`):**
  - Limite de arquivo aumentado para **15 MB** para aceitar fotos de câmeras de smartphones em alta resolução.
  - Compressão HTML5 Canvas inteligente para resolução máxima de 1280x1280 com qualidade 85% em WebP (fallback JPEG), mantendo letras miúdas de rótulos perfeitamente legíveis em arquivos compactos de ~150-250 KB.
- **Componente `ProductImageGalleryUploader.tsx`:**
  - **Drag & Drop:** Zona de arrastar e soltar arquivos com indicador visual animado.
  - **Upload Múltiplo:** Suporte à seleção múltipla com compressão paralela e barra de progresso.
  - **Adição por Link/URL:** Aba retrátil para quem já hospeda imagens externamente.
  - **Grid de Cards de Fotos:**
    - Thumbnail com proporção padronizada e fallback de erro.
    - Fita dourada destacada: `⭐ CAPA PRINCIPAL`.
    - Dropdown com os 6 tipos de classificação com cores e ícones exclusivos.
    - Campo de legenda rápida para lotes ou observações do rótulo.
    - Controles de reordenação (◀ / ▶) e exclusão (🗑️).
    - Botão direto para marcar qualquer imagem como Capa Principal.
  - **Dica de Segurança Alimentar Dinâmica:**
    - Badge verde quando há ao menos uma foto de `LABEL` ou `INGREDIENTS`.
    - Orientação preventiva CeLiLac incentivando a comprovação visual das alegações de alérgenos.
- **Integração no `CreateProductModal.tsx`:**
  - Bloco dedicado de galeria no layout Desktop de 2 colunas.
  - Etapa 2 ("2. Fotos & Galeria") no wizard mobile responsivo.
  - Prévia em tempo real com a foto de capa e badge de total de fotos (`📷 X fotos`).
  - Card lateral de status da documentação visual com atalho rápido.
  - Persistência contínua no auto-save local (`localStorage`).

---

## 3. Validação e Qualidade dos Testes

### Testes do Backend (Jest)
- `tests/unit/domain/catalog/ProductImage.spec.ts`: 100% aprovado.
- `tests/unit/domain/catalog/Product.spec.ts`: 100% aprovado (verificação de coleção e sincronização de capa).
- `tests/unit/application/catalog/CreateProductUseCase.spec.ts`: 100% aprovado (retorno de DTO com imagens).
- **Suíte Completa:** **61 suítes de testes / 361 testes unitários passando**.
- **Build Backend:** `tsc -p tsconfig.build.json` concluído com código de saída 0.

### Build do Frontend (Next.js 14)
- Execução de `npm run build` no `frontend/web-app/`:
  - Compilação das 18 rotas estáticas e dinâmicas com **zero erros de TypeScript** e **zero erros de ESLint**.
  - Tamanho de bundle otimizado.

---

## 4. Próximos Passos (Conforme PRD)
Com as Fases 1 e 2 concluídas (Ficha Técnica Completa + Galeria de Imagens Categorizada), o produto está pronto para a **Fase 3**:
- Integração com o fluxo de aprovação e curadoria de laudos de estabelecimentos e fornecedores.
- Visualização da galeria completa no modal de detalhes do produto (`ProductDetailsModal`) e app mobile Flutter.
