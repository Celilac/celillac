# Protocolo de Autonomia de Testes e Auto-Cura (Self-Healing Loop)

**Status:** ✅ Implementado  
**Entregue em:** 2026-10-02 (FEAT-103 - ver [CHANGELOG.md](../../CHANGELOG.md))  
**Guia do Agente:** [`AGENTS.md`](../../AGENTS.md)  
**Workflows de IA:** [`harness/workflows.md`](../../harness/workflows.md)  

## Visão Geral

O **Protocolo de Autonomia de Testes e Auto-Cura** estabelece uma infraestrutura automatizada e uma governança estrita para que o Agente de IA valide o sistema de ponta a ponta após qualquer implementação ou correção, sob a diretriz:  
> *"Encontrou um problema? Corriga. Achou um bug? Resolva."*

O Agente atua dentro de limites estritos de segurança (*blast radius*) e governança operacional para evitar loops infinitos ou quebras de contrato.

## Ferramentas e Scripts

| Script | Finalidade | Comandos de Execução |
|:-------|:-----------|:---------------------|
| `scripts/agent-verify.mjs` | Orquestrador completo da pirâmide de testes | `node scripts/agent-verify.mjs`<br>`npm run verify`<br>`npm run verify:quick`<br>`npm run verify:offline` |
| `scripts/test-api-smoke.mjs` | Bateria de Smoke Tests HTTP contra API viva (Strict Fail em CI) | `node scripts/test-api-smoke.mjs`<br>`npm run test:smoke` |
| `scripts/audit-api-frontend-parity.mjs` | Auditoria estática de paridade de rotas API e chamadas Frontend | `node scripts/audit-api-frontend-parity.mjs` |

## A Pirâmide de Testes (4 Níveis)

1. **Nível 1 — Validação Estática e Tipos:**
   - Backend: Compilação TypeScript estrita (`tsc -p tsconfig.build.json`).
   - Frontend: Checagem de tipos Next.js (`npm run typecheck` / `tsc --noEmit`).
   - Paridade de Rotas: Mapeamento de rotas backend vs chamadas do frontend.
2. **Nível 2 — Testes Unitários de Domínio:**
   - 87 suítes Jest com 594 casos de teste cobrindo entidades DDD, regras de alérgenos, use cases e middlewares.
3. **Nível 3 — Smoke Tests de Integração HTTP:**
   - `GET /health`: Diagnóstico de conectividade com PostgreSQL.
   - `GET /catalog/products`: Listagem pública de catálogo.
   - `GET /catalog/categories`: Listagem de categorias.
   - `GET /partners`: Listagem de parceiros comerciais homologados.
   - `GET /probe-404-check-route-smoke`: Resiliência e tratamento correto de rota inexistente (404 sem crash).
   - *Nota de CI:* Em pipelines, qualquer falha ou timeout resulta em `exit 1` imediato.
4. **Nível 4 — Verificação E2E / Visual no Navegador:**
   - Acionamento do `browser_subagent` em alterações do `frontend/web-app` para inspeção visual e ausência de erros de console em `http://localhost:3001`.

## Guardrails e Contenção de Riscos (Governança)

1. **Fronteiras de Blast Radius:**
   - O Agente tem autonomia restrita à implementação interna de funções, controllers e estilos da tarefa.
   - É **TERMINANTEMENTE PROIBIDO** flexibilizar ou enfraquecer asserções de testes existentes (`expect`/`assert`), desativar middlewares de segurança ou alterar contratos de endpoints públicos para forçar a passagem de testes.
2. **Cap de 3 Tentativas (Prevenção de Loop Infinito):**
   - O ciclo de auto-cura possui teto de 3 iterações consecutivas. Se a falha persistir na 3ª tentativa, o Agente aborta, desfaz as alterações que quebraram o código (`git checkout -- .`) e reporta o diagnóstico para intervenção humana.
3. **CI Estrito (Sem Falsos Positivos):**
   - Tolerância offline é estritamente proibida em pipelines de CI (`exit 1` obrigatório). Em desenvolvimento local, exige a flag explícita `--allow-offline`.
4. **Sem Backdoors:**
   - Scripts de teste simulam clientes reais de navegador; não há brechas, tokens fixos ou permissões desprotegidas no `BotBlockerMiddleware`.
