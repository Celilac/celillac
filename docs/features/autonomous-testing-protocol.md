# Protocolo de Autonomia de Testes e Auto-Cura (Self-Healing Loop)

**Status:** ✅ Implementado  
**Entregue em:** 2026-10-02 (FEAT-102 - ver [CHANGELOG.md](../../CHANGELOG.md))  
**Guia do Agente:** [`AGENTS.md`](../../AGENTS.md)  
**Workflows de IA:** [`harness/workflows.md`](../../harness/workflows.md)  

## Visão Geral

O **Protocolo de Autonomia de Testes e Auto-Cura** estabelece uma infraestrutura automatizada e uma governança estrita para que o Agente de IA valide o sistema de ponta a ponta após qualquer implementação ou correção, sob a diretriz:  
> *"Encontrou um problema? Corriga. Achou um bug? Resolva."*

O Agente tem autorização irrestrita para consertar qualquer erro detectado nos testes sem interromper o fluxo de trabalho para pedir autorizações desnecessárias.

## Ferramentas e Scripts

| Script | Finalidade | Comandos de Execução |
|:-------|:-----------|:---------------------|
| `scripts/agent-verify.mjs` | Orquestrador completo da pirâmide de testes | `node scripts/agent-verify.mjs`<br>`npm run verify`<br>`npm run verify:quick` |
| `scripts/test-api-smoke.mjs` | Bateria de Smoke Tests HTTP contra API viva | `node scripts/test-api-smoke.mjs`<br>`npm run test:smoke` |
| `scripts/audit-api-frontend-parity.mjs` | Auditoria estática de paridade de rotas API e chamadas Frontend | `node scripts/audit-api-frontend-parity.mjs` |

## A Pirâmide de Testes (4 Níveis)

1. **Nível 1 — Validação Estática e Tipos:**
   - Backend: Compilação TypeScript estrita (`tsc -p tsconfig.build.json`).
   - Frontend: Checagem de tipos Next.js (`npm run typecheck` / `tsc --noEmit`).
   - Paridade de Rotas: Mapeamento de rotas backend vs chamadas do frontend.
2. **Nível 2 — Testes Unitários de Domínio:**
   - 87 suítes Jest com 592 casos de teste cobrindo entidades DDD, regras de alérgenos, use cases e middlewares.
3. **Nível 3 — Smoke Tests de Integração HTTP:**
   - `GET /health`: Diagnóstico de conectividade com PostgreSQL.
   - `GET /catalog/products`: Listagem pública de catálogo.
   - `GET /catalog/categories`: Listagem de categorias.
   - `GET /partners`: Listagem de parceiros comerciais homologados.
   - `GET /probe-404-check-route-smoke`: Resiliência e tratamento correto de rota inexistente (404 sem crash).
4. **Nível 4 — Verificação E2E / Visual no Navegador:**
   - Acionamento do `browser_subagent` em alterações do `frontend/web-app` para inspeção visual e ausência de erros de console em `http://localhost:3001`.

## Regras Críticas de Auto-Cura (Self-Healing)

1. **Autonomia de Resolução:** Falhas em testes, erros de tipo ou quebras de tela devem ser diagnosticados e corrigidos cirurgicamente pelo Agente de imediato.
2. **Critério de Parada:** O Agente só conclui e entrega a tarefa quando todas as camadas estiverem 100% verdes.
3. **Trava de Segurança:** Apenas regras de proteção celíaca (`ALLERGEN_ENGINE`), alterações estruturais destrutivas no banco ou credenciais críticas exigem confirmação humana.
