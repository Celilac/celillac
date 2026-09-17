# Especificação Técnica: Fase 3 — Matriz de Alérgenos, Estilos de Vida e Selos Oficiais

## 1. Visão Geral
A **Fase 3** do redesenho do fluxo de cadastro e especificação técnica de produtos no CeLiLac (`Feedback_Cadastro_Produtos_CeliLac.md`) implementa a camada avançada de **segurança alimentar, conformidade regulatória (ANVISA RDC 727/2022 e RDC 429/2020), estilos de vida e certificações auditadas**.

Com esta entrega, a plataforma deixa de registrar apenas informações binárias básicas de glúten e leite e passa a oferecer:
1. **Matriz Declarada de Alérgenos:** 10 alérgenos críticos da legislação brasileira avaliados em 4 estados semânticos (`FREE`, `CONTAINS`, `TRACES`, `NOT_INFORMED`).
2. **Avaliação Estruturada de Ambiente de Produção:** Isolamento das linhas fabris/cozinhas (`EXCLUSIVE_ENVIRONMENT`, `SHARED_WITH_PROTOCOL`, `SHARED_ENVIRONMENT`, `UNKNOWN_RISK`) e notas de protocolos de sanitização.
3. **Tags de Estilos de Vida e Dietas Especiais:** Suporte nativo a `VEGAN`, `VEGETARIAN`, `NO_ADDED_SUGAR`, `SUGAR_FREE`, `ORGANIC`, `KOSHER`, `HALAL`.
4. **Gerenciamento de Selos Oficiais e Evidências Técnicas:** Associação de certificações reconhecidas (ACELBRA, SVB Vegano, Produto Orgânico Brasil, laudos < 20ppm) com comprovação visual vinculada à galeria de imagens.
5. **Tabela Nutricional ANVISA Expansível:** Declaração estruturada opcional de porção, calorias, carboidratos, açúcares totais e adicionados, proteínas, gorduras, fibras e sódio.
6. **Rastreabilidade da Origem da Informação:** Distinção explícita entre dados declarados pelo estabelecimento (`PARTNER_DECLARED`) e dados auditados tecnicamente pela curadoria CeLiLac (`VERIFIED_BY_CELILAC`).

---

## 2. Modelagem de Dados e Banco de Dados (PostgreSQL)

### Migration `023_add_product_safety_matrix_and_certifications.sql`
A migração introduziu colunas estruturadas na tabela `products` e criou a tabela relacional `product_certifications`:

```sql
-- Extensão da tabela products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS declared_allergens JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cross_contamination_details JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS dietary_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS information_origin VARCHAR(50) DEFAULT 'PARTNER_DECLARED',
  ADD COLUMN IF NOT EXISTS nutritional_info JSONB DEFAULT NULL;

-- Tabela relacional de certificações e selos oficiais
CREATE TABLE IF NOT EXISTS product_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certification_type VARCHAR(80) NOT NULL,
  certifying_entity VARCHAR(150) NOT NULL,
  certificate_code VARCHAR(100),
  valid_until DATE,
  image_id VARCHAR(255),
  verification_status VARCHAR(50) NOT NULL DEFAULT 'DECLARED_BY_PARTNER',
  verification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id);
```

---

## 3. Arquitetura de Domínio (Clean Architecture & DDD)

### 3.1 Value Objects Criados
- **`AllergenPresence`:** Enumeração com 4 estados semânticos:
  - `FREE`: Isento de alérgeno e de traços ("Não Contém").
  - `CONTAINS`: Ingrediente presente na formulação ("Contém").
  - `TRACES`: Risco de contato cruzado declarado ("Pode Conter Traços").
  - `NOT_INFORMED`: Alérgeno ainda não informado pelo produtor.
- **`DietaryFeature`:** `VEGAN`, `VEGETARIAN`, `NO_ADDED_SUGAR`, `SUGAR_FREE`, `ORGANIC`, `KOSHER`, `HALAL`.
- **`InformationOrigin`:** `PARTNER_DECLARED` (declarado) ou `VERIFIED_BY_CELILAC` (auditado).

### 3.2 Entidade `ProductCertification`
Representa selos oficiais como ACELBRA ou SVB.
- Possui métodos de ciclo de vida: `markAsVerified(notes)` e `markAsRejected(reason)`.
- Permite vincular o UUID de uma imagem da galeria (`imageId`) como evidência comprobatória.

### 3.3 Agregado `Product`
- Sincronização bidirecional: Ao registrar `declaredAllergens['GLUTEN'] = 'CONTAINS'`, a propriedade `hasGluten` torna-se `true`; ao registrar `FREE`, torna-se `false`.
- Preserva retrocompatibilidade total com as consultas existentes de motor de alérgenos e busca pública.
- Validação no método de fábrica `Product.create(...)` garantindo instâncias válidas de `ProductCertification`.

---

## 4. Camada de Aplicação e Persistência

### 4.1 `PgProductCatalogRepository`
- Serialização e desserialização robusta de JSONB (`declared_allergens`, `cross_contamination_details`, `dietary_features`, `nutritional_info`).
- Transação única (`BEGIN` / `COMMIT` / `ROLLBACK`) para persistência atômica de `products`, `product_images` e `product_certifications`.
- Suporte a buscas paginadas e enriquecimento de dados.

### 4.2 Casos de Uso e Controladores
- `CreateProductUseCase` e `UpdateProductUseCase` aceitam DTOs contendo todos os dados da Fase 3 e os repassam com segurança ao repositório.
- `CreateProductController` e `UpdateProductController` recebem e validam os novos campos no payload HTTP.

---

## 5. Interface com o Usuário (Frontend Web)

### 5.1 Novos Componentes Reutilizáveis
1. **`AllergenSafetyMatrix.tsx`:**
   - Grade interativa com 10 alérgenos da RDC 727/2022 (Glúten, Leite, Soja, Ovos, Amendoim, Castanhas & Nozes, Peixes, Crustáceos, Trigo e Gergelim).
   - Botões segmentados de 4 estados com cores de alto contraste:
     - `Livre` (Verde `#10b981`)
     - `Contém` (Vermelho `#ef4444`)
     - `Traços` (Âmbar `#f59e0b`)
     - `Não Inf.` (Cinza `#94a3b8`)
   - Botão rápido para marcar alérgenos não declarados como livres com um único clique.
2. **`CrossContaminationSelector.tsx`:**
   - 4 cartões explicativos para o grau de isolamento fabril: Exclusivo, Compartilhado com Protocolo, Compartilhado com Risco de Traços e Risco Desconhecido.
   - Campo de texto para detalhes de procedimentos de sanitização, autoclave e testes swab.
3. **`DietaryFeaturesPicker.tsx`:**
   - Chips selecionáveis com ícones e descrições para Vegano, Vegetariano, Orgânico, Sem Adição de Açúcares, Zero Açúcar, Kosher e Halal.
4. **`ProductCertificationsManager.tsx`:**
   - Formulário com presets para ACELBRA, SVB Vegano, Produto Orgânico Brasil e Laudo Laboratorial < 20ppm.
   - Vinculação direta com fotos comprobatórias da galeria de imagens.
5. **`NutritionalInfoAccordion.tsx`:**
   - Acordeão recolhível contendo porção de referência, valor energético, carboidratos, açúcares totais, açúcares adicionados, proteínas, gorduras totais, gorduras saturadas, fibras e sódio.

### 5.2 Fluxo no `CreateProductModal.tsx`
- **Desktop:** Layout de 2 colunas ampliado com blocos organizados por domínio e prévia em tempo real enriquecida com badges de alérgenos livres, selos e estilo de vida.
- **Mobile:** Wizard de 5 etapas fluidas:
  1. Identificação
  2. Fotos & Galeria
  3. Ingredientes & Alérgenos
  4. Ambiente, Estilos & Certificações
  5. Revisão & Publicação
- **Persistência Local:** O rascunho em `localStorage` salva automaticamente a cada 1.5s todos os dados da matriz, estilos, certificações e tabela nutricional.

---

## 6. Validação e Qualidade
- **Testes Unitários:** 62 suites e 370 testes passando com 100% de sucesso.
- **Build Backend:** TypeScript compilado sem avisos ou erros (`tsc`).
- **Build Frontend:** Next.js compilado com sucesso gerando 18 páginas estáticas e dinâmicas (`next build`).
