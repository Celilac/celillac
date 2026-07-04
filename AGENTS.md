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

## Arquivos de Consulta Obrigatória
Antes de implementar qualquer nova funcionalidade, o Agente DEVE ler e compreender os seguintes documentos:
- `docs/PRD.md` (Visão do produto e requisitos)
- `docs/DOMAIN_MODEL.md` (Contextos Delimitados e regras de negócio)
- `docs/API_CONTRACTS.md` (Contratos de comunicação HTTP)
- `docs/DATABASE.md` (Esquemas de banco e tabelas existentes)

## Fluxo de Trabalho
1. Ler `docs/PRD.md`.
2. Identificar Contexto Delimitado em `docs/DOMAIN_MODEL.md`.
3. Propor plano no chat.
4. Implementar -> Testar -> Validar.
5. **Entregar:** Atualizar documentação conforme as Regras de Entrega de Feature.

## Regras de Entrega de Feature
Ao entregar uma feature nova, o Agente DEVE cumprir:
- **Docs de Feature:** Criar `docs/features/<nome-do-contexto>.md` contendo: status, tabela de endpoints, entidades/VOs principais e regras críticas (baseado no modelo `docs/features/food-profile.md`).
- **README.md:** Adicionar link para a feature nova na tabela "Funcionalidades". O README serve como mapa, não duplique endpoints ou regras detalhadas nele.
- **CHANGELOG.md:** Adicionar uma entrada com data, nome da feature e descrição curta.
- **Contratos (API_CONTRACTS.md):** Atualizar a fonte da verdade de requests/responses. Remover qualquer anotação de "planejado/futuro" assim que o endpoint for criado.
- **Domínio (DOMAIN_MODEL.md):** Regras de negócio conceituais (o "porquê") ficam aqui. O arquivo de feature deve apenas gerar um link para o documento de domínio, sem duplicar o conceito.

## Forma Esperada de Relatório
Ao final de cada tarefa, o Agente deve apresentar um resumo claro contendo:
1. **Status da Missão:** Breve parágrafo confirmando se a meta foi alcançada.
2. **O que foi feito:** Lista em tópicos das principais adições e modificações estruturais.
3. **Qualidade:** Resultado da execução dos testes (`npm test`) com a cobertura de código atingida e confirmação de sucesso do build.
4. **Próximos Passos:** Uma recomendação clara de qual deve ser a próxima feature a ser atacada (conforme PRD).
O Agente também deve manter o artefato `walkthrough.md` sempre atualizado com o histórico de entregas.

## Exemplos Práticos de Tarefas

### ✅ Permitidas (Autonomia Total)
- "Criar testes unitários para a entidade de Usuário."
- "Implementar a lógica de validação de e-mail no Value Object."
- "Criar um script de seed para cadastrar 10 produtos fictícios."
- "Refatorar um controller para extrair lógica para um Use Case."

### ⚠️ Restritas (Exigem Aprovação Humana)
- "Alterar a função `checkCompatibility()` no motor de alérgenos."
- "Adicionar uma nova biblioteca de banco de dados no package.json."
- "Alterar o schema da tabela `users` no PostgreSQL."
- "Modificar a política de CORS no servidor Express."
