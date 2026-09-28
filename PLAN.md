# PLAN.md - Correção de Persistência e Restauração da Declaração de Leite e Derivados na Edição de Produtos

**Status:** Aprovado e em Execução  
**Escopo:** Frontend Web (`CreateProductModal.tsx`) & Backend (`SearchProductsUseCase.ts`, DTOs e Testes)

---

## 1. Diagnóstico do Problema
O usuário relatou que ao cadastrar um produto marcando "Contém Leite", ao abrir a edição do produto ("Editar Produto: Peixe ao molho branco") e tentar salvar sem alterar nada:
1. A opção "Contém Leite" aparece desmarcada visualmente no modal.
2. Ao tentar salvar, uma notificação de erro bloqueia o salvamento:
   *"Declaração Obrigatória: Selecione a declaração de Leite e Derivados (Sem Leite, Contém Leite ou Traços)."*

### Causa Raiz
1. **Frontend (`CreateProductModal.tsx`)**:
   - A função `populateFromProduct(data)` (executada tanto com `productToEdit` quanto com o retorno de `catalogApi.getById`) populava quase todos os campos, mas **não executava `setMilkDeclaration(...)`**.
   - Como o estado inicial de `milkDeclaration` é `null`, os botões de seleção de Leite ficavam desmarcados.
   - Ao salvar, a validação de segurança alimentar `if (!milkDeclaration)` bloqueava a submissão.
   - Além disso, faltava o fallback para inferência textual caso o produto fosse legado ou não possuísse `declaredAllergens.MILK` explicitamente.

2. **Backend (`SearchProductsUseCase.ts`)**:
   - O repositório `PgProductCatalogRepository.search` carrega `declared_allergens` do banco de dados na entidade `Product`.
   - Porém, o DTO `ProductSearchResponseDTO` e o mapeamento em `SearchProductsUseCase` descartavam `declaredAllergens` e outros atributos complementares da entidade.
   - Isso fazia com que, ao clicar em "Editar" diretamente da listagem de produtos do parceiro no Dashboard, o objeto `productToEdit` inicial chegasse com `declaredAllergens` indefinido antes da conclusão da chamada de `getById`.

---

## 2. Etapas de Execução

### Fase 1: Testes no Backend (TDD)
- Atualizar `backend/tests/unit/application/catalog/SearchProductsUseCase.spec.ts`:
  - Garantir que `SearchProductsUseCase` inclua `declaredAllergens` e metadados nos itens retornados da busca e listagem de produtos.

### Fase 2: Ajuste no Backend (`SearchProductsUseCase.ts`)
- Incluir `declaredAllergens`, `crossContaminationDetails`, `shortDescription`, `netContent`, etc., em `ProductSearchResponseDTO` e no retorno de `SearchProductsUseCase.ts`.

### Fase 3: Correção no Frontend (`CreateProductModal.tsx`)
- Na função `populateFromProduct`:
  - Ler `data.declaredAllergens?.['MILK']`. Se for `'FREE' | 'CONTAINS' | 'TRACES'`, atualizar `setMilkDeclaration(decl)`.
  - Fallback inteligente: Se não houver `declaredAllergens.MILK`, inferir através dos termos de leite em `ingredients`, `mayContainTraces` e `crossContamination`.
  - Garantir que `declaredAllergens` mantenha `MILK` em sincronia caso seja inferido.
  - Resetar adequadamente os estados quando o modal for aberto no modo criação (`!productToEdit`).

### Fase 4: Validação e Testes
- Rodar a suíte de testes com `npm test` no backend.
- Executar `npm run build` no backend e no frontend (`frontend/web-app`).
- Atualizar `walkthrough.md` e `CHANGELOG.md`.
