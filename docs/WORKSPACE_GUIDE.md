# WORKSPACE_GUIDE.md - Justificativa da Estrutura

## Decisão: Monorepo
Optamos por um workspace unificado (Monorepo) para o CeLiLac para garantir a **consistência dos contratos**. Como o Backend atende Web, Landing Page e Mobile, manter tudo no mesmo repositório permite que agentes de IA identifiquem impactos de quebra de API instantaneamente em todas as frentes.

## Organização de Pastas
- `backend/`: Segue Clean Architecture rigorosa para proteger o domínio de alérgenos.
- `docs/`: Centraliza o conhecimento. Agentes são instruídos a ler esta pasta ANTES de qualquer `npm install`.
- `harness/`: Contém a "inteligência de controle" (scripts e guardrails).
- `infra/`: Garante que o ambiente de dev seja idêntico para qualquer agente ou humano (via Docker).
