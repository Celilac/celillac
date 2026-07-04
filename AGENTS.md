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

## Workflows de Execução

O Agente DEVE adaptar seu comportamento de acordo com o tipo da tarefa solicitada, seguindo os fluxos abaixo:

### 1. Workflow para Nova Feature
1. **Ler** documentação obrigatória (`PRD`, `DOMAIN_MODEL`, `API_CONTRACTS`, `DATABASE`).
2. **Identificar** o módulo/contexto afetado.
3. **Criar plano** estruturado.
4. **Solicitar confirmação humana** se a feature afetar algum domínio crítico (ex: motor de alérgenos).
5. **Criar ou atualizar testes** antes ou junto do código (TDD).
6. **Implementar** em pequenos passos.
7. **Rodar testes** e linter (`npm test`, `npm run build`).
8. **Gerar relatório final** atualizando `walkthrough.md`.

### 2. Workflow para Correção de Bug
1. **Reproduzir** o problema (analisar logs ou código existente).
2. **Criar teste que falha** para garantir que o bug foi isolado.
3. **Corrigir** a menor parte possível para não causar regressões.
4. **Rodar testes** em toda a suíte para validar a correção.
5. **Explicar** de forma concisa a causa e a correção no relatório de entrega.

### 3. Workflow para Alteração de Regra de Negócio
1. **Ler** `docs/ALLERGEN_ENGINE.md` e `docs/DOMAIN_MODEL.md`.
2. **Descrever impacto** que a regra trará no resto do sistema.
3. **Aguardar autorização humana** (modificar regras impacta diretamente a vida do consumidor).
4. **Criar testes** cobrindo todos os cenários críticos e edge-cases.
5. **Implementar** a regra exclusivamente na camada de Domain.
6. **Validar** com a suíte de testes.
7. **Registrar decisão** no `DOMAIN_MODEL.md` e `CHANGELOG.md`.

### 4. Workflow para Alteração de Banco de Dados
1. **Ler** `docs/DATABASE.md`.
2. **Propor alteração** (novas tabelas, colunas, constraints ou índices).
3. **Explicar impacto** sobre os dados existentes e performance.
4. **Aguardar autorização humana** se envolver a criação/execução de uma migration estrutural.
5. **Criar migration** de forma segura.
6. **Rodar testes** para assegurar que a camada de repositório continua íntegra.
7. **Documentar alteração** no `docs/DATABASE.md`.

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
