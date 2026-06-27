# Workspace CeLiLac

## Estrutura do Monorepo
Este projeto está organizado como um monorepo para facilitar a consistência entre o backend e as múltiplas interfaces (Web, Mobile, Landing Page).

### Justificativa das Decisões:
- **Clean Architecture no Backend:** Garante que a lógica de segurança alimentar (Alérgenos) seja independente de tecnologias como Express ou PostgreSQL.
- **DDD:** Facilita a comunicação entre agentes de IA e humanos através de uma linguagem ubíqua e contextos delimitados.
- **Pasta docs/:** Centraliza o conhecimento para evitar que a IA tome decisões baseadas em alucinações.
- **Pasta harness/:** Isolamento das regras de governança da IA.

## Como começar
1. `cd infra/docker && docker-compose up -d` (Sobe o banco).
2. `cd backend && npm install && npm run dev` (Inicia o servidor).
