# DOMAIN_MODEL.md - Bounded Contexts Detalhados

## 1. Perfil Alimentar
- **Responsabilidade:** Gerenciar restrições e sensibilidades.
- **Entidades:** Profile, Allergy, Intolerance.
- **Value Objects:** SeverityLevel (LOW, MEDIUM, HIGH, FATAL).
- **Regras Críticas:** 
    - Um perfil deve ter pelo menos uma restrição para ser considerado "Ativo".
    - Mudanças em restrições 'FATAL' exigem revalidação de todo o histórico de consumo.

## 2. Catálogo de Produtos e Parceiros
- **Responsabilidade:** Inventário de itens e curadoria de estabelecimentos.
- **Entidades:** Product, Ingredient, Partner (Restaurante/Loja).
- **Agregados:** Product é a raiz. Ingredientes são entidades filhas.
- **Regras:** 
    - Um produto sem lista de ingredientes é marcado como "PENDENTE DE ANÁLISE".
    - O campo `cross_contamination` é obrigatório.

## 3. Compatibilidade Alimentar (Core Engine)
- **Responsabilidade:** Match entre Perfil e Produto.
- **Entidades:** CompatibilityReport.
- **Regras:**
    - O motor deve ser agnóstico a banco de dados (Pure Domain).
    - Deve suportar "Traços de Alérgenos" como um modificador de risco.

## 4. Administracao
- **Responsabilidade:** Gestão de denúncias de dados incorretos e moderação.

## 5. Avaliações e Confiança (Social Proof)
- **Responsabilidade:** Coletar a percepção dos usuários sobre a acurácia dos rótulos dos produtos e construir a métrica de confiabilidade da comunidade.
- **Entidades:** Review
- **Value Objects:** Rating (1 a 5 estrelas)
- **Regras:**
    - Um usuário só pode avaliar um mesmo produto uma vez (Upsert na avaliação).
