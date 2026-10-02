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
1. **Planejamento Obrigatório por Ambiente (Apenas para Novas Features):**
   - **Para Novas Features:**
     - **No Antigravity IDE (Gemini / Code Agent):** O plano de implementação DEVE ser apresentado EXCLUSIVAMENTE como o **Artefato Nativo do IDE** denominado obrigatoriamente **`plano_de_implementacao.md`** com o título `# Plano de Implementação` (`write_to_file` no diretório de artefatos com `RequestFeedback: true` no `ArtifactMetadata`), exibindo o botão "Proceed". É TERMINANTEMENTE PROIBIDO criar múltiplos arquivos de plano (`plan_x.md`, `plan_y.md`) ou arquivos `PLAN.md` no workspace. O Agente deve SEMPRE atualizar/sobrescrever o mesmo artefato `plano_de_implementacao.md`.
     - **No Claude Code (CLI via terminal):** Crie o plano como `PLAN.md` local para acompanhamento da tarefa.
   - **Para Correção de Bugs / Fixes em Geral:** NÃO é necessário criar plano de implementação nem pausar para autorização; o Agente tem autonomia para diagnosticar e aplicar o fix diretamente.

2. **Aprovação Humana Prévia Obrigatória (Apenas para Novas Features):**
   - **Para Novas Features:** O Agente está PROIBIDO de iniciar desenvolvimento, alterar arquivos de código, criar componentes ou aplicar alterações estruturais sem que o usuário tenha explicitamente aprovado o plano (seja clicando em "Proceed" no artefato nativo ou autorizando explicitamente no chat). Após criar o artefato de plano, o Agente DEVE pausar e aguardar a decisão do usuário.
   - **Para Correções de Bugs / Fixes Gerais:** O Agente pode tocar direto sem precisar pedir autorização, aplicando as correções e testes de forma ágil e objetiva.

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

### Execução de Tarefas Autorizadas (Após Aprovação do Plano para Features / Autonomia para Fixes)
O Agente tem autonomia para proceder com os passos acordados nos seguintes cenários:
- Correção de bugs, ajustes de CSS/UI, pequenos reparos e qualquer fix diretamente, sem necessidade de aprovação prévia.
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

### 2. Workflow para Correção de Bug / Qualquer Fix
1. **Reproduzir e Diagnosticar** o problema (analisar logs ou código existente).
2. **Tocar Direto (Sem Plano/Sem Pausa):** Em correções de bugs, fixes visuais ou pequenos ajustes, o Agente tem autonomia para aplicar a correção imediatamente sem precisar criar artefato de plano nem pausar para autorização prévia.
3. **Criar ou ajustar teste** para garantir que o bug foi isolado e evitar regressões.
4. **Corrigir** a menor parte possível para manter a estabilidade.
5. **Rodar testes** e validações (`npm test`, `npm run build`).
6. **Explicar** de forma concisa a causa e a correção no relatório final.

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
5. **Criar migration de forma segura e idempotente:** Criar arquivo `.sql` em `harness/scripts/migrations/` e registrar no `docker-compose.yml`.
6. **Sincronizar no `connection.ts`:** Replicar as DDLs de forma defensiva no `backend/src/infrastructure/database/connection.ts` usando `executeSafeDdl` para execução automática em bancos já persistidos na VPS.
7. **Rodar testes** para assegurar que a camada de repositório continua íntegra.
8. **Documentar alteração** no `docs/DATABASE.md`.

## 🔄 Protocolo de Autonomia de Testes e Auto-Cura (Self-Healing Loop)
> **Diretiva Sagrada:** *"Encontrou um problema? Corriga. Achou um bug? Resolva."*

Após qualquer implementação de funcionalidade ou correção de bug, o Agente DEVE testar autonomamente o sistema antes de considerar a tarefa entregue. O Agente opera sob um **ciclo contínuo de auto-cura**:

1. **Dever de Testar Pós-Alteração:**
   - O Agente DEVE rodar a bateria de validação usando o orquestrador autônomo: `node scripts/agent-verify.mjs` (ou `npm run verify` / `npm run verify:quick`).
   - Se a alteração envolver telas ou componentes no `frontend/web-app`, o Agente DEVE acionar o `browser_subagent` na URL local (`http://localhost:3001`), navegar pelo fluxo afetado, verificar a ausência de exceções no console do navegador e inspecionar a interface.

2. **Princípio de Resolução Autônoma (Não Pare para Perguntar):**
   - Se qualquer camada acusar erro (falha de compilação TypeScript, erro de teste unitário Jest, quebra de rota no Smoke Test HTTP ou bug visual/console no navegador):
   - **O Agente está TERMINANTEMENTE PROIBIDO de interromper a execução para relatar o problema ou pedir orientações se tiver capacidade técnica de corrigi-lo.**
   - O Agente DEVE:
     1. Isolar a causa raiz do erro a partir dos logs e stack traces.
     2. Aplicar a correção cirúrgica imediatamente no código, esquema ou componente.
     3. Re-executar os testes relevantes.
     4. Repetir o ciclo até atingir **100% verde**.

3. **Fronteiras de Segurança (Quando Parar):**
   - O Agente tem autonomia irrestrita para corrigir qualquer bug de lógica, UI, tipagem, integração de rotas e banco local.
   - Apenas interrompa o fluxo para intervenção humana se a correção exigir:
     - Alterar regras críticas de proteção de saúde alimentar celíaca (`ALLERGEN_ENGINE`).
     - Modificar mecanismos centrais de autenticação/criptografia que firam as políticas de segurança.
     - Operações destrutivas com perda irreversível de dados.

## 🛡️ Regra de Resiliência de Deploy e Prevenção de Falhas na VPS (Zero 502 Bad Gateway)
Para evitar que o backend entre em crash após o deploy na VPS (o que causa `502 Bad Gateway` no Traefik e a mensagem "Erro ao entrar" no frontend), o Agente DEVE cumprir rigorosamente:
1. **Sincronização Idempotente no `connection.ts`:**
   - O container oficial do PostgreSQL só executa scripts de `/docker-entrypoint-initdb.d/` na **primeira criação** do volume. Em volumes existentes na VPS, novas migrations NÃO são executadas pelo Docker automaticamente.
   - Portanto, **toda nova migration DEVE ser replicada no `connection.ts`** dentro de blocos `executeSafeDdl` com `IF NOT EXISTS` e `DROP CONSTRAINT IF EXISTS`.
   - NUNCA introduzir colunas `NOT NULL` sem valor `DEFAULT` em tabelas existentes.
2. **Inicialização Resiliente do Servidor:**
   - O servidor Express DEVE inicializar e escutar a porta HTTP mesmo em caso de lentidão temporária do banco, permitindo que a rota `/health` forneça diagnóstico ativo (`status: 503 DEGRADED`). O processo NÃO deve abortar abruptamente com `process.exit(1)`.
3. **Healthcheck Ativo no CD (`cd-deploy.yml`):**
   - O pipeline de deploy SSH valida a subida dos containers com `docker compose ps` e `wget -qO- http://localhost:3000/health`. Em caso de falha, os logs do container são exibidos no output do GitHub Actions e o pipeline falha para intervenção rápida.
4. **Resolução de API no Frontend (`client.ts`):**
   - Requisições ao backend em produção devem sempre apontar para o domínio oficial `https://api.celilac.com.br`, sem injetar portas fantasmas (ex: `:3002`).
   - Erros de rede (Failed to fetch) e status 502/503 devem ser exibidos ao usuário como "Serviço temporariamente indisponível. O backend está em manutenção ou inicializando."

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
3. **Qualidade:** Resultado da execução dos testes (`npm test`, `npm run verify`) com a cobertura de código atingida e confirmação de sucesso do build.
4. **Auto-Cura Realizada:** Descrição concisa de problemas/bugs encontrados durante a validação e como foram sanados autonomamente.
5. **Próximos Passos:** Uma recomendação clara de qual deve ser a próxima feature a ser atacada (conforme PRD).
O Agente também deve manter o artefato `walkthrough.md` sempre atualizado com o histórico de entregas.

## Checklist de Validação (Aceite de Alterações)
Para que uma alteração feita pelo Agente seja considerada concluída e pronta para aceite (Merge/Commit), os seguintes critérios DEVEM ser obrigatoriamente preenchidos:
- [ ] Bateria de testes e auto-cura executada com 100% de sucesso (`node scripts/agent-verify.mjs` ou `npm run verify`).
- [ ] Testes unitários Jest passando (100% verde).
- [ ] Compilação do Backend (`tsc -p tsconfig.build.json`) e Build do Frontend sem erros de tipagem.
- [ ] Smoke tests de API HTTP respondendo com sucesso (`/health`, produtos, parceiros).
- [ ] Teste de navegação e interface executado via `browser_subagent` (quando envolver alterações no frontend).
- [ ] Migrations novas replicadas de forma idempotente no `connection.ts` e registradas no `docker-compose.yml`.
- [ ] Rota `/health` e resiliência de boot preservadas.
- [ ] Nenhum segredo ou credencial (variáveis de ambiente, senhas, tokens) exposto no código.
- [ ] Nenhuma regra crítica de negócio alterada sem autorização prévia humana.
- [ ] Documentação atualizada quando necessário (`PRD`, `DATABASE`, contratos, etc).
- [ ] Aderência estrita à Clean Architecture.
- [ ] Aderência aos Bounded Contexts (sem ferir os limites dos domínios).
- [ ] Relatório final gerado de forma clara e objetiva com seção de auto-cura se aplicável.
- [ ] Revisão humana solicitada e realizada antes do aceite definitivo da branch.
