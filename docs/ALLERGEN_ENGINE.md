
---
| Atributo | Descrição |
| :--- | :--- |
| **Objetivo** | Especificar a lógica de segurança alimentar. |
| **Quem consulta** | Agentes de IA e Desenvolvedores Backend/Mobile |
| **Decisões que controla** | Cálculo de compatibilidade e níveis de risco. |
| **Validação Humana** | QUALQUER ALTERAÇÃO exige aprovação humana. |
---
# ALLERGEN_ENGINE.md - Especificação do Motor de Alérgenos

## Objetivo
Definir a lógica determinística de validação de segurança alimentar. O agente de IA **não deve alterar** este arquivo sem autorização humana.

## Matriz de Risco (Exemplo Inicial)
| Ingrediente | Perfil: Celíaco | Perfil: Intolerante Lactose |
|-------------|-----------------|-----------------------------|
| Farinha Trigo | BLOQUEADO (Glúten) | PERMITIDO |
| Leite Pó | PERMITIDO | ALERTA (Lactose) |
| Aveia (Traços) | RISCO (Contaminação) | PERMITIDO |

## Algoritmo de Decisão
1. Buscar `UserProfile.restrictions`.
2. Buscar `Product.ingredients` e `Product.cross_contamination_info`.
3. Para cada restrição do usuário, verificar presença no produto.
4. Se `contamination_info` indicar risco, marcar status como `DANGER`.

## Critérios de Validação Automática
Qualquer PR que altere esta lógica deve passar em 100% dos testes de regressão de cenários reais de contaminação cruzada.
