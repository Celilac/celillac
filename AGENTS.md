# AGENTS.md - Guia do Agente de IA para o CeLiLac

## Visão do Projeto
O CeLiLac é uma plataforma de segurança alimentar focada em celíacos e pessoas com restrições alimentares.

## Arquitetura e Tecnologias
- **Backend:** Node.js/TypeScript, Clean Architecture, DDD.
- **Banco de Dados:** PostgreSQL.
- **Frontend:** Web (React/Next), Mobile (Flutter/React Native).
- **Padronização:** O código deve seguir SOLID e ser altamente testado.

## Regras Obrigatórias
1. **Nunca implemente sem um plano:** Antes de qualquer código, crie um `PLAN.md` na tarefa.
2. **Camadas Isoladas:** Regras de negócio ficam APENAS no `domain`. Controllers não decidem lógica.
3. **Segurança Alimentar:** Qualquer alteração no `ALLERGEN_ENGINE` exige aprovação humana imediata.
4. **Testes Primeiro:** Siga a cultura de TDD sempre que possível.

## Comandos Permitidos
- `npm test`, `npm run build`, `docker-compose up`.

## Comandos Proibidos
- `rm -rf /`, `chmod 777`, acessos a credenciais de produção.

## Fluxo de Trabalho
1. Ler `docs/PRD.md`.
2. Identificar Contexto Delimitado em `docs/DOMAIN_MODEL.md`.
3. Propor plano no chat.
4. Implementar -> Testar -> Validar.
