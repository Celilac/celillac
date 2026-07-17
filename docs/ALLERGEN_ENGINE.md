# ALLERGEN_ENGINE.md — Especificação do Motor de Compatibilidade

> ⚠️ **DOCUMENTO DE MÁXIMA CRITICIDADE**
> Qualquer alteração neste documento ou no código correspondente exige **100% de aprovação humana**.
> Nenhuma mudança automática é permitida aqui.
>
> **Arquivo de referência:** [`backend/src/domain/allergen-engine/AllergenEngine.ts`](../backend/src/domain/allergen-engine/AllergenEngine.ts)
> **Aprovação original:** 2026-06-30
> **Quem deve consultar:** Agentes de IA de Backend, Auditores de Segurança, Desenvolvedores

---

## 1. Objetivo

O `AllergenEngine` é o **Serviço de Domínio Central** do CeLiLac. Ele calcula se um produto é seguro para um usuário com base no perfil alimentar cadastrado (alérgenos + severidades).

É um serviço **puro de domínio**: sem estado, sem efeitos colaterais, agnóstico a banco de dados. Recebe apenas objetos de domínio e retorna um `CompatibilityReport`.

---

## 2. Regras do Motor (Aprovadas em 2026-06-30)

As 8 regras abaixo são a **única definição oficial** de como o motor funciona. Alterações exigem aprovação humana e atualização deste documento.

| ID | Regra | Condição | Resultado |
|:---|:------|:---------|:----------|
| **R1** | Produto sem ingredientes declarados | `product.ingredients` vazio ou ausente | `BLOCKED` (princípio da precaução) |
| **R2** | Perfil sem restrições ativas | `profile.isActive() === false` | `SAFE` (sem dados para bloquear) |
| **R3** | Restrição FATAL + alérgeno nos **ingredientes** | severity = FATAL, found in ingredients | `BLOCKED` |
| **R4** | Restrição FATAL + alérgeno nos **traços** (cross_contamination) | severity = FATAL, found in crossContamination | `BLOCKED` |
| **R5** | Restrição HIGH + alérgeno nos **ingredientes** | severity = HIGH, found in ingredients | `DANGER` |
| **R6** | Restrição MEDIUM ou LOW + alérgeno nos **ingredientes** | severity = MEDIUM\|LOW, found in ingredients | `WARNING` |
| **R7** | Traços para severidades não-FATAL | found in crossContamination, severity ≠ FATAL | `WARNING` |
| **R8** | Risco final = maior entre todos os conflitos | múltiplos conflitos encontrados | RiskLevel mais alto vence |

> **Nota sobre R1:** O princípio da precaução prioriza a segurança do celíaco. Um produto sem informação é tratado como produto perigoso — nunca como produto seguro.

> **Nota sobre R8:** Todos os conflitos são retornados no `conflicts[]`, não apenas o mais grave. O usuário tem direito à informação completa.

---

## 3. Tipos de Risco (`RiskLevel`)

```
SAFE    → Nenhum alérgeno do perfil encontrado no produto.
WARNING → Alérgeno de severidade LOW ou MEDIUM encontrado (ingredientes ou traços não-FATAL).
DANGER  → Alérgeno de severidade HIGH encontrado nos ingredientes.
BLOCKED → Alérgeno FATAL encontrado (ingredientes ou traços) OU produto sem ingredientes.
```

**Ordenação numérica (usada internamente):**
```
SAFE = 0  <  WARNING = 1  <  DANGER = 2  <  BLOCKED = 3
```

---

## 4. Níveis de Severidade do Perfil (`SeverityLevel`)

| Nível | Descrição | Tolera traços? | RiskLevel máximo que pode causar |
|:------|:----------|:--------------:|:--------------------------------:|
| `LOW` | Sensibilidade leve | ✅ Sim | `WARNING` |
| `MEDIUM` | Intolerância moderada | ✅ Sim | `WARNING` |
| `HIGH` | Alergia severa | ✅ Sim (WARNING) | `DANGER` (em ingredientes) |
| `FATAL` | Celíaco / Alergia grave | ❌ **Não** — traços = BLOCKED | `BLOCKED` |

---

## 5. Matriz de Alérgenos e Termos de Busca

O motor detecta alérgenos por busca de texto em `ingredients` e `crossContamination`. Os termos abaixo são os únicos reconhecidos. Adicionar ou remover termos exige aprovação humana.

| Alérgeno | Termos de busca (PT/EN) |
|:---------|:------------------------|
| `GLUTEN` | glúten, gluten, trigo, wheat, cevada, barley, centeio, rye, aveia, oats |
| `LACTOSE` | lactose, leite, milk, creme, cream, manteiga, butter, queijo, cheese, whey |
| `NUTS` | castanha, nozes, amêndoa, almond, amendoim, peanut, nuts, pistache, pistachio, macadâmia |
| `SOY` | soja, soy, soybean |
| `EGGS` | ovo, ovos, egg, eggs, albumina, albumin |
| `SHELLFISH` | camarão, shrimp, lagosta, lobster, caranguejo, crab, shellfish, mariscos |
| `FISH` | peixe, fish, atum, tuna, salmão, salmon, bacalhau, anchova |
| `WHEAT` | trigo, wheat, farinha de trigo, glúten de trigo |
| `SESAME` | gergelim, sesame, tahine, tahini |
| `OTHER` | *(sem termos — reservado para uso futuro)* |

> ⚠️ `GLUTEN` possui detecção adicional pelo campo booleano `product.hasGluten`. Se `hasGluten === true`, o glúten é considerado presente nos ingredientes independentemente do texto.

---

## 6. Fluxo de Decisão

```
AllergenEngine.check(profile, productSnapshot)
        │
        ├── perfil.isActive() === false?
        │       └── retorna SAFE ("Perfil sem restrições ativas.")
        │
        ├── product.ingredients vazio?
        │       └── retorna BLOCKED ("Produto sem ingredientes. Princípio da precaução.")
        │
        └── Para cada restriction em profile.restrictions:
                │
                ├── Busca termos do alérgeno em ingredients e crossContamination
                │
                ├── Alérgeno encontrado?
                │       └── Não → próxima restrição (sem conflito)
                │
                └── Sim → resolveRisk(severity, inIngredients, inCrossContamination)
                        │
                        ├── FATAL + (ingredients OU traços) → BLOCKED
                        ├── HIGH + ingredients              → DANGER
                        ├── MEDIUM|LOW + ingredients        → WARNING
                        └── qualquer + traços (não FATAL)   → WARNING
                                │
                                └── Acumula em conflicts[]
                                    Mantém o riskLevel mais alto (R8)

Retorna CompatibilityReport:
  { isCompatible, riskLevel, conflicts[], reasoning }
```

---

## 7. Interfaces de Entrada e Saída

### Entrada — `ProductSnapshot`
```typescript
interface ProductSnapshot {
  id:                string;
  name:              string;
  ingredients:       string;   // Texto livre (PT/EN)
  hasGluten:         boolean;  // Campo declarado pelo fabricante
  crossContamination: string;  // Texto livre de traços (ex: "Pode conter traços de glúten")
}
```

### Saída — `CompatibilityReport`
```typescript
interface CompatibilityReport {
  isCompatible: boolean;         // true apenas se riskLevel === SAFE
  riskLevel:    RiskLevel;       // SAFE | WARNING | DANGER | BLOCKED
  conflicts:    ConflictDetail[]; // Todos os conflitos encontrados (R8)
  reasoning:    string;          // Texto explicativo para exibição ao usuário
}

interface ConflictDetail {
  allergen:  AllergenType;   // Qual alérgeno causou o conflito
  severity:  SeverityLevel;  // Severidade do perfil para esse alérgeno
  reason:    string;         // Texto: "[FATAL] GLUTEN — detectado nos ingredientes"
}
```

---

## 8. Política de Alteração

| Tipo de alteração | Permitida ao Agente? | Fluxo obrigatório |
|:------------------|:--------------------:|:------------------|
| Adicionar novo `AllergenType` | ❌ Não | Proposta → Aprovação humana → Testes → Implementação |
| Adicionar novo termo de busca em `ALLERGEN_SEARCH_TERMS` | ❌ Não | Proposta → Aprovação humana → Testes regressivos completos |
| Alterar regras R1–R8 | ❌ Não | Proposta → Aprovação humana + Auditor de Segurança → Testes → Implementação |
| Alterar `RiskLevel` ou sua ordenação | ❌ Não | Idem acima |
| Alterar `SeverityLevel` | ❌ Não | Idem acima |
| Criar testes para o motor | ✅ Sim | Workflow autônomo padrão |
| Documentar o motor (este arquivo) | ✅ Sim | Com revisão humana posterior |

> **Regra de ouro:** Qualquer mudança que afete **o que o motor retorna** para um dado par (perfil, produto) é uma alteração de regra de negócio crítica e exige aprovação humana obrigatória.

