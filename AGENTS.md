# AGENTS.md - Guia do Agente de IA para o CeLiLac

## Visão do Projeto
O CeLiLac é uma plataforma de segurança alimentar focada em celíacos e pessoas com restrições alimentares.

## Arquitetura e Tecnologias
- **Backend:** Node.js/TypeScript, Clean Architecture, DDD.
- **Banco de Dados:** PostgreSQL.
- **Frontend:** Web (React/Next), Mobile (Flutter).
- **Padronização:** O código deve seguir SOLID e ser altamente testado.

## Identidade Visual (Marca)
- Fonte única da marca: `frontend/web-app/public/brand/`. Use sempre `logo_with_transparent_background.png` (maior resolução, com alpha) para qualquer novo uso da logo — web ou mobile.
- Mobile (`frontend/mobile-app`, Flutter): a logo mestre vive em `assets/brand/logo.png` (cópia do arquivo acima, registrada em `pubspec.yaml`) e todo ícone/splash gerado (mipmaps Android em `android/app/src/main/res/mipmap-*/ic_launcher.png`, `AppIcon.appiconset` no iOS, `drawable/launch_image.png` e `LaunchImage.imageset`) deriva dela. Para exibir a marca em telas, use o widget `lib/shared/widgets/brand_logo.dart` (`BrandLogo`) em vez de emoji ou texto solto.
- Nunca reintroduzir os assets placeholder padrão do template Flutter (o ícone azul "F") nem emojis como substituto da logo.

## Regras Obrigatórias
1. **Planejamento Obrigatório por Ambiente:**
   - **No Antigravity IDE (Gemini / Code Agent):** O plano de implementação DEVE ser apresentado EXCLUSIVAMENTE como o **Artefato Nativo do IDE** denominado obrigatoriamente **`plano_de_implementacao.md`** com o título `# Plano de Implementação` (`write_to_file` no diretório de artefatos com `RequestFeedback: true` no `ArtifactMetadata`), exibindo o botão "Proceed". É TERMINANTEMENTE PROIBIDO criar múltiplos arquivos de plano (`plan_x.md`, `plan_y.md`) ou arquivos `PLAN.md` no workspace. Para qualquer nova solicitação, o Agente deve SEMPRE atualizar/sobrescrever o mesmo artefato `plano_de_implementacao.md`.
   - **No Claude Code (CLI via terminal):** Crie o plano como `PLAN.md` local para acompanhamento da tarefa.

2. **Aprovação Humana Prévia Obrigatória (Nenhum código sem autorização):** O Agente está PROIBIDO de iniciar desenvolvimento, alterar arquivos de código, criar componentes ou aplicar correções sem que o usuário tenha explicitamente aprovado o plano (seja clicando em "Proceed" no artefato nativo ou autorizando explicitamente no chat). Após criar o artefato de plano, o Agente DEVE pausar e aguardar a decisão do usuário.
3. **Camadas Isoladas:** Regras de negócio ficam APENAS no `domain`. Controllers não decidem lógica.
4. **Segurança Alimentar:** Qualquer alteração no `ALLERGEN_ENGINE` exige aprovação humana imediata.
5. **Testes Primeiro:** Siga a cultura de TDD sempre que possível.


## Guardrails e Políticas de Segurança (Harness)
Esta seção define as limitações estritas de operação do Agente, baseadas no princípio do menor privilégio e segurança *by-design*.

### Comandos Permitidos
- Execução de testes locais: `npm test`, `jest`
- Build e compilação: `npm run build`, `tsc`
- Gestão local de containers: `docker-compose up`, `docker-compose down`
- Linting e formatação: `npm run lint`, `prettier`

### Comandos Proibidos
- Deleção em massa ou alteração arbitrária de permissões: `rm -rf /`, `chmod 777`
- Comandos que exigem elevação de privilégio: `sudo`, `su`
- Comandos destrutivos de rede e deploy direto via shell.
- Acessos a instâncias, servidores remotos ou bancos de dados de produção.

### Arquivos Somente Leitura (Read-Only para o Agente)
- Documentação central legada que fuja do escopo da tarefa atual.
- Logs e dumps de banco de dados extraídos de produção (arquivos `.log` reais não devem ser apagados, apenas lidos).

### Políticas Técnicas e de Segurança
- **Dependências Externas:** O Agente está terminantemente proibido de instalar bibliotecas sem autorização humana. Se precisar, deve propor no plano e pausar.
- **Variáveis de Ambiente:** Nunca *hardcodar* senhas, tokens ou chaves criptográficas em código. Sempre usar leitura segura de `.env` via `process.env`.
- **Dados Sensíveis (PII):** Não armazenar nem trafegar informações críticas de saúde sem devida proteção. Hashes e JWT não podem vazar nas respostas JSON das rotas.
- **Uso de Sandbox:** Todo código gerado atua no sandbox do projeto. Scripts não devem tentar modificar o sistema operacional *host* além dos artefatos da aplicação.
- **Princípio do Menor Privilégio:** A infraestrutura de um contexto não pode acessar as tabelas de outro diretamente. Funções não devem ter poderes além do seu propósito estrito.
- **Remoção de Testes:** É expressamente proibido deletar, comentar ou pular testes (`.skip`) para mascarar quebras. Se um teste quebrar, a lógica (ou o teste defasado) deve ser corrigida.

### Execução de Tarefas Autorizadas (Após Aprovação do Plano)
SOMENTE após o usuário ter revisado e aprovado o plano da tarefa, o Agente tem autonomia para proceder com os passos acordados nos seguintes cenários:
- Criar testes unitários para o motor de compatibilidade alimentar (`AllergenEngine.spec.ts`).
- Criar testes de integração para o cadastro de produtos.
- Implementar lógicas de validação em Value Objects (ex: `Email`, `Rating`).
- Criar scripts de seed com dados fictícios em `harness/scripts/`.
- Refatorar controllers para extrair lógica para Use Cases (Clean Architecture).
- Implementar endpoint de busca de produtos compatíveis.
- Criar componente visual de alerta alimentar no frontend web.
- Atualizar documentação de API em `docs/API_CONTRACTS.md` após criar um endpoint.

### Ações Restritas (Exigem Pausa e Aprovação Humana Obrigatória)
- ⚠️ Alterar regras de compatibilidade alimentar.
- ⚠️ Alterar Termos de Uso ou Políticas de Privacidade.
- ⚠️ Modificar mecanismos de autenticação (senhas, sessões, JWT).
- ⚠️ Alterar scripts de migração (*migrations*) de banco de dados já aplicadas.
- ⚠️ Adicionar, atualizar ou remover dependências.
- ⚠️ Remover testes da suíte ou reduzir *threshold* de cobertura.
- ⚠️ Alterar regras de segurança (CORS, middlewares de Rate Limit).
- ⚠️ Realizar Deploy.
- ⚠️ Conectar ou ler dados de ambiente de produção.

## Arquivos de Consulta Obrigatória
Antes de implementar qualquer nova funcionalidade, o Agente DEVE ler e compreender os seguintes documentos:
- `docs/PRD.md` (Visão do produto, personas e requisitos)
- `docs/DOMAIN_MODEL.md` (Contextos Delimitados e regras de negócio)
- `docs/API_CONTRACTS.md` (Contratos de comunicação HTTP)
- `docs/DATABASE.md` (Esquemas de banco e tabelas existentes)
- `docs/ARCHITECTURE.md` (Regras de Clean Architecture e estrutura de camadas)
- `docs/FRONTEND_STRATEGY.md` (Regras para agentes que atuam em interfaces web/mobile)

## Workflows de Execução
O Agente DEVE adaptar seu comportamento de acordo com o tipo da tarefa solicitada, seguindo os fluxos abaixo:

### 1. Workflow para Nova Feature
1. **Ler** documentação obrigatória (`PRD`, `DOMAIN_MODEL`, `API_CONTRACTS`, `DATABASE`).
2. **Identificar** o módulo/contexto afetado.
3. **Criar ou Atualizar o Plano no Artefato Único (`plano_de_implementacao.md`):** Gerar ou sobrescrever exclusivamente o arquivo `plano_de_implementacao.md` com o título `# Plano de Implementação` e `RequestFeedback: true` no metadata. NUNCA criar múltiplos arquivos de plano nem arquivos `PLAN.md` no workspace.
4. **PAUSAR e Aguardar Aprovação Humana:** Aguardar o usuário clicar no botão "Proceed" ou autorizar explicitamente no chat antes de editar ou criar arquivos.
5. **Criar ou atualizar testes** antes ou junto do código (TDD).
6. **Implementar** em pequenos passos.
7. **Rodar testes** e linter (`npm test`, `npm run build`).
8. **Gerar relatório final** atualizando `walkthrough.md`.

### 2. Workflow para Correção de Bug
1. **Reproduzir e Diagnosticar** o problema (analisar logs ou código existente).
2. **Apresentar Diagnóstico e Atualizar o Plano Único (`plano_de_implementacao.md`):** Atualizar o artefato único `plano_de_implementacao.md` com `RequestFeedback: true`. NUNCA criar novos arquivos de plano separados.
3. **PAUSAR e Aguardar Aprovação Humana:** Somente aplicar as alterações após autorização expressa do usuário.
4. **Criar teste que falha** para garantir que o bug foi isolado.
5. **Corrigir** a menor parte possível para não causar regressões.
6. **Rodar testes** em toda a suíte para validar a correção.
7. **Explicar** de forma concisa a causa e a correção no relatório de entrega.

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

## Checklist de Validação (Aceite de Alterações)
Para que uma alteração feita pelo Agente seja considerada concluída e pronta para aceite (Merge/Commit), os seguintes critérios DEVEM ser obrigatoriamente preenchidos:
- [ ] Testes unitários passando.
- [ ] Testes de integração passando (quando aplicável).
- [ ] Linter executado sem erros.
- [ ] Build concluído com sucesso.
- [ ] Nenhum segredo ou credencial (variáveis de ambiente, senhas, tokens) exposto no código.
- [ ] Nenhuma regra crítica de negócio alterada sem autorização prévia humana.
- [ ] Documentação atualizada quando necessário (`PRD`, `DATABASE`, contratos, etc).
- [ ] Aderência estrita à Clean Architecture.
- [ ] Aderência aos Bounded Contexts (sem ferir os limites dos domínios).
- [ ] Relatório final gerado de forma clara e objetiva.
- [ ] Revisão humana solicitada e realizada antes do aceite definitivo da branch.
