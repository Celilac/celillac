# Plano de Implementação — Registro e Moderação de Categorias

## 1. Visão Geral
Permitir que estabelecimentos parceiros registrem novas categorias de produtos sob demanda no catálogo, as quais ficam imediatamente utilizáveis pelo parceiro criador, mas no status `PENDING_APPROVAL` (não visíveis publicamente nos filtros de clientes até aprovação). A administração pode aprovar a categoria tornando-a pública (`GLOBAL` para todos os parceiros e clientes) ou restrita (`RESTRICTED` apenas para o parceiro que a criou), ou rejeitá-la (`REJECTED`).

---

## 2. Etapas de Execução

### Etapa 1: Banco de Dados & Infraestrutura
- Criar migração SQL `020_create_product_categories_table.sql` com schema da tabela `product_categories` e seed das 10 categorias padrão (`APPROVED`, `GLOBAL`).
- Atualizar `backend/src/infrastructure/database/connection.ts` para sincronização automática.

### Etapa 2: Domínio & Casos de Uso (Backend DDD)
- Entidade `Category.ts` (`id`, `name`, `normalizedName`, `status`, `visibility`, `partnerId`, `createdByUserId`, `rejectionReason`).
- Interface `ICategoryRepository.ts` e implementação `PgCategoryRepository.ts`.
- Casos de uso:
  - `CreateCategoryUseCase` (Parceiro cadastra nova categoria em `PENDING_APPROVAL`).
  - `ListCategoriesUseCase` (Lista categorias disponíveis para um parceiro ou públicas).
  - `ReviewCategoryUseCase` (Admin aprova como `GLOBAL`, `RESTRICTED` ou rejeita).
  - `ListAdminCategoriesUseCase` (Admin lista todas as categorias com filtros).
- Testes unitários TDD cobrindo todos os cenários.

### Etapa 3: Controladores e Rotas
- `CategoryController.ts` (`POST /catalog/categories`, `GET /catalog/categories`).
- `AdminCategoryController.ts` (`GET /admin/categories`, `PATCH /admin/categories/:id/review`).
- Registrar rotas em `catalog.routes.ts` e `admin.routes.ts`.

### Etapa 4: Frontend Web
- Utilitário de API `frontend/web-app/src/api/category.ts`.
- Atualizar `CreateProductModal.tsx` com carregamento dinâmico e opção/modal inline para registrar nova categoria instantaneamente.
- Criar página de moderação administrativa `frontend/web-app/src/app/admin/categories/page.tsx`.
- Adicionar atalho de navegação em `Header.tsx` para administradores.

### Etapa 5: Validação e Documentação
- Executar testes backend (`npm test`).
- Executar build frontend (`npm run build`).
- Atualizar `API_CONTRACTS.md`, `DATABASE.md`, `README.md` e `CHANGELOG.md`.
