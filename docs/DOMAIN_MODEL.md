# DOMAIN_MODEL.md - Bounded Contexts Detalhados

> **Quem deve consultar:** Agentes de IA, Desenvolvedores, Arquitetos
> **Decisões que controla:** Regras de negócio conceituais, limites entre contextos, invariantes de domínio
> **Alterações que exigem validação humana:** Qualquer regra que afete compatibilidade alimentar ou dados de saúde

---

## 1. Perfil Alimentar
- **Responsabilidade:** Gerenciar restrições e sensibilidades alimentares do usuário.
- **Entidades:** `Profile`, `Allergy`, `Intolerance`.
- **Value Objects:** `SeverityLevel` (LIFESTYLE, LOW, MEDIUM, HIGH, FATAL), `Restriction` (allergen + severity).
- **Regras Críticas:**
    - Um perfil deve ter pelo menos uma restrição para ser considerado "Ativo".
    - Mudanças em restrições `FATAL` exigem revalidação de todo o histórico de consumo.
    - Um perfil inativo resulta em `SAFE` para qualquer produto — não bloqueia nada.

---

## 2. Catálogo de Produtos
- **Responsabilidade:** Inventário de produtos alimentícios com informações de segurança.
- **Entidades:** `Product`, `Ingredient`.
- **Agregados:** `Product` é a raiz. Ingredientes são entidades filhas.
- **Value Objects:** `AnalysisStatus` (PENDING_ANALYSIS, APPROVED, FLAGGED).
- **Regras:**
    - Um produto sem lista de ingredientes é marcado como `PENDING_ANALYSIS`.
    - O campo `cross_contamination` é obrigatório no cadastro.
    - Produto sem ingredientes nunca pode ter resultado `SAFE` no motor.

---

## 3. Catálogo de Parceiros
- **Responsabilidade:** Gerenciar estabelecimentos (restaurantes, lojas) que cadastram produtos.
- **Entidades:** `Partner`.
- **Value Objects:** `PartnerStatus` (ACTIVE, SUSPENDED, PENDING_APPROVAL).
- **Regras:**
    - Um parceiro deve ser aprovado por um ADMIN antes de poder cadastrar produtos.
    - Parceiro suspenso perde acesso ao cadastro de produtos.
    - Produtos de um parceiro suspenso devem ser sinalizados no catálogo.

---

## 4. Ingredientes e Restrições (Contexto de Suporte)
- **Responsabilidade:** Vocabulário controlado de ingredientes e mapeamento de alérgenos.
- **Entidades:** `IngredientDefinition` (futuro).
- **Value Objects:** `AllergenType` (GLUTEN, LACTOSE, NUTS, SOY, EGGS, SHELLFISH, FISH, WHEAT, SESAME, OTHER).
- **Regras:**
    - `ALLERGEN_SEARCH_TERMS` é o mapeamento oficial de termos de busca por alérgeno.
    - Qualquer alteração nos termos de busca exige aprovação humana (impacta o motor).
    - Este contexto serve como suporte tanto ao Perfil Alimentar quanto ao Motor de Compatibilidade.

---

## 5. Compatibilidade Alimentar (Core Engine)
- **Responsabilidade:** Calcular o match entre Perfil Alimentar e Produto. É o coração do CeLiLac.
- **Entidades:** `CompatibilityReport`.
- **Value Objects:** `RiskLevel` (SAFE, WARNING, DANGER, BLOCKED, UNEVALUATED), `ConflictDetail`.
- **Regras:**
    - O motor deve ser agnóstico a banco de dados (Pure Domain Service).
    - Deve suportar "Traços de Alérgenos" como um modificador de risco.
    - Respeita a **RN-CONSUMER-07 / Invariante 11.6**: se o consumidor possui perfil incompleto/sem restrições (`!profile.isActive()`), o sistema retorna `UNEVALUATED` e `isCompatible = false`, eliminando a falsa sensação de segurança.
    - Respeita a **Invariante 11.5 (Tolerância a Contaminação Cruzada)**: se `acceptsCrossContamination === false`, traços para severidades `HIGH` elevam o risco de `WARNING` para `DANGER`. Para `FATAL`, o resultado é sempre `BLOCKED` (invariante biológica imutável).
    - As 9 regras do motor (R1–R9) estão definidas em `docs/ALLERGEN_ENGINE.md` e são imutáveis sem aprovação humana.
    - ⚠️ **Contexto de máxima criticidade** — qualquer alteração exige aprovação humana.

---

## 6. IAM — Identidade e Acesso
- **Responsabilidade:** Autenticação, autorização e gerenciamento de identidade dos usuários.
- **Entidades:** `User`.
- **Value Objects:** `Email` (validado), `PasswordHash` (bcrypt, nunca texto puro), `UserRole` (CELIACO, PARCEIRO, ADMIN).
- **Regras:**
    - E-mail deve ser único no sistema.
    - Senha armazenada exclusivamente como hash bcrypt.
    - JWT tem validade de 7 dias (configurável via `JWT_EXPIRES_IN`).
    - Um usuário CELIACO não pode acessar rotas de moderação de ADMIN.
    - Alterações no mecanismo de autenticação exigem aprovação humana.

---

## 7. Avaliações e Confiança (Social Proof)
- **Responsabilidade:** Coletar a percepção dos usuários sobre a acurácia dos rótulos dos produtos e construir a métrica de confiabilidade da comunidade.
- **Entidades:** `Review`.
- **Value Objects:** `Rating` (1 a 5 estrelas).
- **Regras:**
    - Um usuário só pode avaliar um mesmo produto uma vez (Upsert na avaliação).
    - Avaliações são visíveis para qualquer usuário autenticado.

---

## 8. Administração e Moderação
- **Responsabilidade:** Gestão de denúncias de dados incorretos e moderação do catálogo.
- **Entidades:** `Report`.
- **Value Objects:** `ReportStatus` (PENDING, IN_REVIEW, RESOLVED, DISMISSED), `ReportReason` (INCORRECT_INGREDIENTS, MISSING_ALLERGEN, WRONG_CROSS_CONTAMINATION, OTHER).
- **Regras:**
    - Uma denúncia em estado final (RESOLVED ou DISMISSED) não pode ter seu status alterado.
    - Todo reporte entra com status PENDING.
    - Apenas ADMIN pode alterar o status de uma denúncia.

---

## 10. Consumidor
- **Responsabilidade:** Gerenciar a identidade de consumo da pessoa usuária, integrando preferências de experiência, perfil de alérgenos e status de participação.
- **Entidades / Agregados:** Aggregate Root `Consumer` (`id`, `userId`, `generalPreferences`, `isFoodProfileComplete`, `isFoodProfileCritical`, `status`, `statusChangedAt`, `statusChangedBy`, `statusChangeReason`).
- **Value Objects:** `ConsumerStatus` (CONTA_CRIADA, PERFIL_INCOMPLETO, PERFIL_CONFIGURADO, PERFIL_CRITICO, ATIVO, INATIVO).
- **Regras:**
    - Todo `Consumer` se vincula a um único `userId` do IAM.
    - O status do Consumidor é mantido e sincronizado com o Perfil Alimentar (`FoodProfile`).
    - O Consumidor pode transitar entre `ATIVO` e `INATIVO` com registro obrigatório de auditoria (`statusChangedAt`, `statusChangedBy`, `statusChangeReason`).
    - A desativação (`INATIVO`) desativa a participação personalizada nas buscas do consumidor, mas **não bloqueia o acesso à conta** no IAM.

---

## 11. Pedidos *(Planejado — Não Implementado)*
- **Responsabilidade:** Gerenciar pedidos de produtos em parceiros (restaurantes/lojas) pelo consumidor.
- **Entidades previstas:** `Order`, `OrderItem`.
- **Value Objects previstos:** `OrderStatus` (PENDING, CONFIRMED, DELIVERED, CANCELLED), `OrderTotal`.
- **Regras previstas:**
    - Um pedido só pode ser confirmado se todos os produtos são compatíveis com o perfil do usuário.
    - Cancelamento disponível até a confirmação do parceiro.
- **⚠️ Exige aprovação humana** antes de qualquer implementação — impacto em dados financeiros e alimentares.

---

## 12. Pagamentos *(Planejado — Não Implementado)*
- **Responsabilidade:** Processar transações financeiras entre consumidores e parceiros.
- **Entidades previstas:** `Payment`, `Refund`.
- **Value Objects previstos:** `Money` (valor + moeda), `PaymentStatus` (PENDING, APPROVED, FAILED, REFUNDED).
- **Regras previstas:**
    - Pagamento só é processado após confirmação do pedido.
    - Reembolso deve ser processado em caso de cancelamento após confirmação.
- **⚠️ Exige aprovação humana** antes de qualquer implementação — contexto financeiro regulado.


