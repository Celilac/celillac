# DOMAIN_MODEL.md - Modelo de Domínio CeLiLac

## Visão Geral do Domínio
O CeLiLac utiliza DDD para isolar a lógica complexa de segurança alimentar de detalhes de infraestrutura.

## Bounded Contexts (Contextos Delimitados)

### 1. Identidade e Acesso (IAM)
- **Responsabilidade:** Gestão de usuários, autenticação e permissões (celíacos, estabelecimentos, admin).
- **Entidades:** User, Role, Permission.
- **Value Objects:** Email, Password, CPF.

### 2. Perfil Alimentar (Core)
- **Responsabilidade:** Gerenciar restrições específicas de cada usuário (Celiaquia, APLV, intolerância a lactose, etc).
- **Entidades:** UserProfile, Restriction.
- **Value Objects:** SensitivityLevel, AllergenType.
- **Regra Crítica:** Um perfil nunca deve ser "vazio" se o usuário se declarou celíaco.

### 3. Catálogo de Produtos e Parceiros
- **Responsabilidade:** Cadastro de produtos, ingredientes e estabelecimentos parceiros.
- **Entidades:** Product, Partner, Ingredient.
- **Agregado:** Product (Raiz) -> List<Ingredient>.

### 4. Motor de Compatibilidade Alimentar (Allergen Engine - Crítico)
- **Responsabilidade:** Cruzar o Perfil Alimentar com os Ingredientes do Produto para gerar alertas de segurança.
- **Entidades:** CompatibilityResult.
- **Regras:**
    - Se "Trigo/Cevada/Centeio" presente -> Alerta Máximo para Celíacos.
    - Se "Pode conter traços" -> Alerta de Risco para Celíacos.
- **Nota:** Este contexto deve ser 100% isolado e testado exaustivamente.

### 5. Avaliações e Confiança (Social)
- **Responsabilidade:** Feedbacks de usuários sobre a veracidade das informações dos produtos.
- **Entidades:** Review, TrustScore.

## Mapa de Contextos (Context Map)
- O **Allergen Engine** consome dados de **Perfil Alimentar** e **Catálogo de Produtos** (Upstream-Downstream).
