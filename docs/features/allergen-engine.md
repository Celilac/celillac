# Motor de Alérgenos (Core Domain)

> **Arquivo de máxima criticidade.** Qualquer alteração exige aprovação humana conforme [`harness/guardrails.md`](../../harness/guardrails.md).

**Status:** ✅ Implementado
**Entregue em:** 2026-06-30, endpoint exposto em 2026-07-01 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Especificação completa:** [`docs/ALLERGEN_ENGINE.md`](../ALLERGEN_ENGINE.md)
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#4-compatibilidade-alimentar)

## O que faz

Calcula a compatibilidade entre um `FoodProfile` e um produto, retornando um relatório completo de riscos.

## Endpoint

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/compatibility/check` | Calcula compatibilidade entre perfil e produto |

## Regras implementadas (aprovadas em 2026-06-30)

| Regra | Condição | Resultado |
|:------|:---------|:----------|
| R1 | Produto sem ingredientes declarados | `BLOCKED` (precaução) |
| R2 | Perfil sem restrições | `SAFE` |
| R3 | Celíaco (`FATAL`) + glúten nos ingredientes | `BLOCKED` |
| **R4** | **Celíaco (`FATAL`) + traços de glúten (`cross_contamination`)** | **`BLOCKED`** |
| R5 | `HIGH` + alérgeno presente | `DANGER` |
| R6 | `MEDIUM`/`LOW` + alérgeno presente | `WARNING` |
| R7 | Múltiplos conflitos | Risco mais alto prevalece |
| R8 | Múltiplos conflitos | Todos retornados (sem omissão) |

## Níveis de risco

```
⛔ BLOCKED  — Celíaco ou produto sem ingredientes
⚠️ DANGER   — Alérgeno de alta severidade
🟡 WARNING  — Alérgeno de baixa/média severidade
✅ SAFE     — Nenhum conflito encontrado
```

## Testes

`backend/tests/unit/domain/allergen-engine/AllergenEngine.spec.ts` ← 9 casos críticos de segurança alimentar
`backend/tests/unit/application/allergen-engine/CheckCompatibilityUseCase.spec.ts`
