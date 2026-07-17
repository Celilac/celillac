# WORKSPACE_GUIDE.md - Justificativa da Estrutura e Filosofia do Harness

## Filosofia do Harness

> **"O agente não é o harness. O harness é o ambiente que orienta, limita, valida e registra o trabalho do agente."**

O objetivo do harness CeLiLac **não é criar o sistema** — é **preparar o ambiente** para que agentes de IA possam ajudar no desenvolvimento com:
- **Contexto:** documentos de domínio, contratos de API, regras de arquitetura.
- **Direção:** workflows padronizados por tipo de tarefa.
- **Limites:** guardrails que definem o que o agente pode e não pode fazer.
- **Segurança:** proteções para o domínio crítico de segurança alimentar.
- **Validação:** testes, linter, build e checklists de aceite.

O harness é composto por: `AGENTS.md`, `docs/`, `harness/`, `.github/workflows/` e os hooks git.

---

## Decisão: Monorepo
Optamos por um workspace unificado (Monorepo) para o CeLiLac para garantir a **consistência dos contratos**. Como o Backend atende Web, Landing Page e Mobile, manter tudo no mesmo repositório permite que agentes de IA identifiquem impactos de quebra de API instantaneamente em todas as frentes.

## Organização de Pastas
- `backend/`: Segue Clean Architecture rigorosa para proteger o domínio de alérgenos.
- `docs/`: Centraliza o conhecimento. Agentes são instruídos a ler esta pasta ANTES de qualquer `npm install`.
- `harness/`: Contém a "inteligência de controle" (scripts, guardrails, hooks e workflows).
- `docker-compose.yml`: Na raiz do monorepo. Sobe PostgreSQL (local dev) e os serviços do backend e web-app.
- `.github/workflows/`: Pipelines de CI/CD — proteção da main e validação automática.
