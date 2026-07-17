# HARNESS_EVALUATION.md — Auto-avaliação do Harness CeLiLac

> **Propósito:** Demonstrar como o harness do CeLiLac atende aos critérios de avaliação
> definidos na *Especificação Operacional do Harness do CeLiLac* (PDF, §13).
> **Data:** 2026-07-17

---

## Critérios de Avaliação — Demonstração de Conformidade

### 1. Clareza da proposta

| Item | Status | Evidência |
|:-----|:------:|:----------|
| Proposta documentada e justificada | ✅ | [`docs/WORKSPACE_GUIDE.md`](WORKSPACE_GUIDE.md) explica decisões de monorepo |
| Visão do produto clara | ✅ | [`docs/PRD.md`](PRD.md) — personas, jornadas, requisitos funcionais e não-funcionais |
| Ponto de entrada único para agentes | ✅ | [`AGENTS.md`](../AGENTS.md) na raiz do projeto |

---

### 2. Alinhamento com a ideia correta de harness

O harness do CeLiLac **não é o agente** — é o conjunto de arquivos, regras, workflows, contratos e proteções que **orienta, limita, valida e registra** o trabalho do agente.

| Componente do harness | Arquivo | Propósito |
|:----------------------|:--------|:----------|
| Ponto de entrada | [`AGENTS.md`](../AGENTS.md) | Regras, workflows, guardrails e relatórios |
| Restrições de segurança | [`harness/guardrails.md`](../harness/guardrails.md) | Limites operacionais do agente |
| Workflows | [`harness/workflows.md`](../harness/workflows.md) | Fluxos padronizados por tipo de tarefa |
| Proteção de commits | [`harness/hooks/pre-commit`](../harness/hooks/pre-commit) | Bloqueia arquivos proibidos |
| Proteção de push | [`harness/hooks/pre-push`](../harness/hooks/pre-push) | Bloqueia push direto na main |
| CI/CD | [`.github/workflows/`](../.github/workflows/) | Pipeline de validação automática |

---

### 3. Aplicação adequada de Clean Architecture

| Critério | Status | Evidência |
|:---------|:------:|:----------|
| 4 camadas definidas e documentadas | ✅ | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §1–§2 |
| 6 regras do agente documentadas | ✅ | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §3 |
| Ports & Adapters documentados | ✅ | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §4 |
| Estrutura de pastas de referência | ✅ | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) §6 |
| Código backend segue a arquitetura | ✅ | `backend/src/domain/`, `application/`, `infrastructure/`, `interfaces/` |
| Domain sem dependências externas | ✅ | `backend/src/domain/allergen-engine/AllergenEngine.ts` — zero imports de infra |

---

### 4. Aplicação adequada de DDD

| Critério | Status | Evidência |
|:---------|:------:|:----------|
| 10 bounded contexts definidos | ✅ | [`docs/DOMAIN_MODEL.md`](DOMAIN_MODEL.md) — BC 1 a 10 |
| Responsabilidade por BC | ✅ | Cada BC tem seção própria com entidades, VOs e regras |
| Contextos futuros sinalizados | ✅ | Pedidos e Pagamentos marcados como *Planejado — Não Implementado* |
| Core Domain identificado | ✅ | Compatibilidade Alimentar (§5) marcada como máxima criticidade |
| Proteção do Core Domain | ✅ | [`docs/ALLERGEN_ENGINE.md`](ALLERGEN_ENGINE.md) com política de alteração |

---

### 5. Separação correta entre backend, frontend web, landing page e mobile

| Camada | Status | Evidência |
|:-------|:------:|:----------|
| Backend único | ✅ | `backend/` — Node.js/TypeScript, porta 3000 |
| Frontend web (app autenticado) | ✅ | `frontend/web-app/` — Next.js |
| Landing page | ✅ | `frontend/landing-page/` — Next.js estático |
| App mobile | ✅ | `frontend/mobile-app/` — React Native + Expo |
| Regras de interface documentadas | ✅ | [`docs/FRONTEND_STRATEGY.md`](FRONTEND_STRATEGY.md) |
| Sem duplicação de lógica | ✅ | Compatibilidade calculada **exclusivamente** no backend |

---

### 6. Tratamento adequado do PostgreSQL

| Critério | Status | Evidência |
|:---------|:------:|:----------|
| Docker Compose configurado | ✅ | `docker-compose.yml` na raiz |
| Separação de ambientes documentada | ✅ | [`docs/DATABASE.md`](DATABASE.md) §1 |
| Estratégia de migrations | ✅ | [`docs/DATABASE.md`](DATABASE.md) §5 + `harness/scripts/migrations/` |
| Estratégia de seeds | ✅ | [`docs/DATABASE.md`](DATABASE.md) §6 + `harness/scripts/seed.ts` |
| Dados proibidos documentados | ✅ | [`docs/DATABASE.md`](DATABASE.md) §6 |
| Comandos permitidos/proibidos | ✅ | [`docs/DATABASE.md`](DATABASE.md) §7 |
| Agente não acessa produção | ✅ | [`harness/guardrails.md`](../harness/guardrails.md) item 8 |

---

### 7. Qualidade dos guardrails

| Critério | Status | Evidência |
|:---------|:------:|:----------|
| Comandos permitidos listados | ✅ | [`AGENTS.md`](../AGENTS.md) §Comandos Permitidos |
| Comandos proibidos listados | ✅ | [`AGENTS.md`](../AGENTS.md) §Comandos Proibidos |
| Arquivos somente leitura | ✅ | [`AGENTS.md`](../AGENTS.md) §Arquivos Somente Leitura |
| 9 ações restritas com aprovação | ✅ | [`AGENTS.md`](../AGENTS.md) §Ações Restritas |
| Política de dependências | ✅ | [`AGENTS.md`](../AGENTS.md) §Políticas Técnicas |
| Política de variáveis de ambiente | ✅ | [`AGENTS.md`](../AGENTS.md) §Políticas Técnicas |
| Política de dados sensíveis (PII) | ✅ | [`AGENTS.md`](../AGENTS.md) §Políticas Técnicas + [`docs/SECURITY.md`](SECURITY.md) |
| Uso de sandbox | ✅ | [`AGENTS.md`](../AGENTS.md) §Políticas Técnicas |
| Princípio do menor privilégio | ✅ | [`AGENTS.md`](../AGENTS.md) §Políticas Técnicas |
| Proteção por hooks git | ✅ | `harness/hooks/pre-commit` + `harness/hooks/pre-push` |

---

### 8. Qualidade dos workflows

| Critério | Status | Evidência |
|:---------|:------:|:----------|
| Workflow para nova feature | ✅ | [`AGENTS.md`](../AGENTS.md) WF-01 + [`harness/workflows.md`](../harness/workflows.md) WF-01 |
| Workflow para correção de bug | ✅ | [`AGENTS.md`](../AGENTS.md) WF-02 + [`harness/workflows.md`](../harness/workflows.md) WF-03 |
| Workflow para alteração de regra | ✅ | [`AGENTS.md`](../AGENTS.md) WF-03 + [`harness/workflows.md`](../harness/workflows.md) WF-02 |
| Workflow para alteração de banco | ✅ | [`AGENTS.md`](../AGENTS.md) WF-04 + [`harness/workflows.md`](../harness/workflows.md) WF-04 |
| Forma de relatório definida | ✅ | [`AGENTS.md`](../AGENTS.md) §Forma Esperada de Relatório |

---

### 9. Capacidade de proteger regras críticas do domínio alimentar

| Mecanismo de proteção | Status | Evidência |
|:----------------------|:------:|:----------|
| AllergenEngine imutável sem aprovação | ✅ | Cabeçalho do arquivo `.ts` + [`docs/ALLERGEN_ENGINE.md`](ALLERGEN_ENGINE.md) §8 |
| Motor 100% testado (9 casos críticos) | ✅ | `backend/tests/unit/domain/allergen-engine/AllergenEngine.spec.ts` |
| Regras R1–R8 documentadas | ✅ | [`docs/ALLERGEN_ENGINE.md`](ALLERGEN_ENGINE.md) §2 |
| Frontend/mobile proibidos de calcular | ✅ | [`docs/FRONTEND_STRATEGY.md`](FRONTEND_STRATEGY.md) §Princípio Central |
| Política de BLOCKED nunca vira SAFE | ✅ | [`docs/PRD.md`](PRD.md) §RNF-01 |

---

### 10. Capacidade de orientar agentes de IA sem deixar o processo livre demais

O harness usa **múltiplas camadas de controle** para que o agente tenha autonomia produtiva sem risco de dano:

```
Camada 1 — Orientação:  AGENTS.md, docs/, ARCHITECTURE.md, ALLERGEN_ENGINE.md
Camada 2 — Restrição:   guardrails.md, ações restritas, comandos proibidos
Camada 3 — Validação:   npm test, npm run build, harness/scripts/validate.sh
Camada 4 — Revisão:     AGENTS.md checklist, walkthrough.md, revisão humana obrigatória
Camada 5 — Proteção:    hooks pre-commit + pre-push, GitHub Actions (protect-main, ci-develop)
```

---

### 11. Proximidade com um workspace realmente utilizável

| Critério | Status |
|:---------|:------:|
| Backend rodando com `npm run dev` | ✅ |
| Frontend web rodando com `npm run dev` | ✅ |
| Landing page rodando com `npm run dev` | ✅ |
| App mobile rodando com `npm start` (Expo) | ✅ |
| Banco de dados via `docker-compose up -d` | ✅ |
| 99 testes passando | ✅ |
| Todos os bounded contexts implementados (exceto Pedidos e Pagamentos) | ✅ |
| API documentada em `docs/API_CONTRACTS.md` + `docs/openapi.yaml` | ✅ |
| Seed de dados fictícios funcional | ✅ |
