# Feature: Motor de Compatibilidade Alimentar (`AllergenEngine`)

> **Bounded Context:** Compatibilidade Alimentar (Core Engine)  
> **Status:** Concluído e Homologado  
> **Última Atualização:** 2026-08-01 (FEAT-048 / Issue #34)  
> **Documento Conceitual Primário:** [`docs/ALLERGEN_ENGINE.md`](../ALLERGEN_ENGINE.md)

---

## 1. Visão Geral

O `AllergenEngine` é o serviço de domínio puro e agnóstico a banco de dados responsável por calcular a compatibilidade e o nível de risco entre o perfil de restrições alimentares de um consumidor (`FoodProfile`) e o instantâneo de dados de um produto (`ProductSnapshot`).

---

## 2. Invariantes e Regras Oficiais (R1–R9)

| Regra | Condição | Resultado |
|:---|:---|:---|
| **R1** | Produto sem ingredientes declarados | `BLOCKED` *(princípio da precaução)* |
| **R2** | Perfil sem restrições ativas | `UNEVALUATED` *(perfil incompleto - RN-CONSUMER-07)* |
| **R3** | Restrição `FATAL` + alérgeno nos ingredientes | `BLOCKED` |
| **R4** | Restrição `FATAL` + alérgeno nos traços (contaminação cruzada) | `BLOCKED` |
| **R5** | Restrição `HIGH` + alérgeno nos ingredientes | `DANGER` |
| **R6** | Restrição `MEDIUM` ou `LOW` + alérgeno nos ingredientes | `WARNING` |
| **R7** | Traços para severidades não-FATAL (com tolerância declarada `acceptsCrossContamination = true`) | `WARNING` |
| **R8** | O risco final da consulta é o risco mais grave entre todos os conflitos | `RiskLevel` máximo vence |
| **R9** | **Invariante 11.5 (Contaminação Cruzada):** Traços + não-tolerância (`acceptsCrossContamination = false`) para severidade `HIGH` | `DANGER` *(eleva de WARNING para DANGER)* |

> **RN-CONSUMER-05 (Issue #34):** Propagação do campo `type: RestrictionType` no `ConflictDetail` e prefixo textual no `reasoning` (`[ALLERGY/FATAL] GLUTEN...`), garantindo clareza e transparência no veredito entre Alergias, Intolerâncias e Preferências Alimentares.

---

## 3. Cobertura de Testes de Segurança Alimentar

Suíte de testes mantida em [`backend/tests/unit/domain/allergen-engine/AllergenEngine.spec.ts`](../../backend/tests/unit/domain/allergen-engine/AllergenEngine.spec.ts):

- **TC-01 a TC-08**: Casos críticos fundamentais (produto com glúten, traços, sem glúten, severidades `HIGH`/`MEDIUM`, ausência de ingredientes, múltiplas restrições).
- **TC-09**: Perfil inativo (sem restrições) → `UNEVALUATED` e `isCompatible = false` *(RN-CONSUMER-07 / Issue #32)*.
- **TC-10**: Severidade `HIGH` + traços + `acceptsCrossContamination = false` → retorne `DANGER`.
- **TC-11**: Severidade `HIGH` + traços + `acceptsCrossContamination = true` → retorne `WARNING`.
- **TC-12**: Severidade `FATAL` + traços + `acceptsCrossContamination = true` → retorne `BLOCKED` *(invariante biológica imutável)*.
- **TC-13**: Retorno de `ConflictDetail.type = ALLERGY` e prefixo no `reason` para restrições do tipo alergia *(RN-CONSUMER-05 / Issue #34)*.
- **TC-14**: Rejeição de `ALLERGY` + `LOW` no domínio e diferenciação de `DIETARY_PREFERENCE` + `LOW` *(RN-CONSUMER-05 / Issue #34)*.
