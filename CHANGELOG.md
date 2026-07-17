# Changelog — CeLiLac

Histórico de entregas do projeto. Formato: `Data | Feature | Descrição`.

| Data | Feature | Descrição |
|:-----|:--------|:----------|
| 2026-06-29 | FEAT-001 | Módulo IAM completo (22 testes) |
| 2026-06-30 | FEAT-002 | Perfil Alimentar (`FoodProfile` + `Restriction`) |
| 2026-06-30 | FEAT-003 | Motor de Alérgenos com 9 casos críticos |
| 2026-07-01 | FEAT-002 | `UpdateFoodProfileUseCase` — atualização de restrições via `PUT /food-profile/:userId` |
| 2026-07-01 | FEAT-003 | Endpoint `POST /compatibility/check` exposto na API |
| 2026-07-01 | FEAT-004 | Frontend Web App + Landing Page (Next.js 14) |
| 2026-07-01 | FEAT-005 | Bounded Context Catálogo de Produtos (`CreateProduct`, `SearchProducts`) |
| 2026-07-04 | FEAT-006 | Implementação do módulo de Administração e Moderação |
| 2026-07-04 | FEAT-007 | Início das Interfaces: Dashboard Web (UI Glassmorphism) e Scaffolding App Mobile (Expo) |
| 2026-07-04 | FEAT-008 | Bounded Context de Avaliações (Social Proof) e Pipeline de Automação CI/CD |
| 2026-07-07 | FEAT-009 | App Mobile completo (React Native + Expo): Auth JWT via expo-secure-store, Scanner EAN, Busca, Perfil Alimentar e Alertas visuais por risco |
| 2026-07-07 | FEAT-010 | Middleware de Autenticação JWT no Backend (Express), mitigação de IDOR/BOLA (403 Forbidden), tratamento global de erros (500) e cabeçalhos de segurança OWASP/CORS |
| 2026-07-07 | FEAT-011 | Docker Compose (Full-Stack Dockerization): containerização do backend e do web-app com PostgreSQL e persistência de dados local configurada |
| 2026-07-07 | FEAT-012 | Identidade Visual & Temas: paleta de cores institucional, suporte completo a temas claro/escuro e estilização global no Web App |
| 2026-07-07 | FEAT-013 | Painel de Marca no Login/Registro: layout split-screen com painel de marca promocional adaptivo e topbar simplificada nas páginas de login e cadastro |
| 2026-07-07 | BUGFIX-014 | Correções e estabilização do Web App (upsert de perfil, HTTP client/headers, sessionStorage) e correção do parâmetro de busca no backend (`query` vs `q`) |
| 2026-07-12 | BUGFIX-015 | Correção de sintaxe JSX e conflito de mesclagem na página de perfil no Web App |
| 2026-07-17 | HARNESS-016 | Branch strategy: branch `develop` criada + `protect-main.yml` (bloqueia push direto na main) + `ci-develop.yml` (pipeline completo na develop) + hook `pre-push` local |
| 2026-07-17 | HARNESS-017 | Gap Analysis — Bloco 1: `docs/PRD.md` substituído por PRD real (3 personas, 5 jornadas de usuário, RF-01 a RF-06, RNF-01 a RNF-05) |
| 2026-07-17 | HARNESS-018 | Gap Analysis — Bloco 1: `docs/ALLERGEN_ENGINE.md` documentado completamente (regras R1–R8, matriz de alérgenos 10 tipos, tabela SeverityLevel×RiskLevel, fluxo de decisão, interfaces, política de alteração) |
| 2026-07-17 | HARNESS-019 | Gap Analysis — Bloco 2: `docs/DOMAIN_MODEL.md` expandido de 5 para 10 bounded contexts (adicionados IAM, Catálogo de Parceiros, Ingredientes e Restrições, Pedidos e Pagamentos como planejados) |
| 2026-07-17 | HARNESS-020 | Gap Analysis — Bloco 2: `docs/ARCHITECTURE.md` expandido com 6 regras do agente, Services de Domínio, padrão Ports & Adapters, diagrama de dependências e estrutura de pastas de referência |
| 2026-07-17 | HARNESS-021 | Gap Analysis — Bloco 3: `docs/DATABASE.md` atualizado com separação formal de 3 ambientes (local/teste/produção), banco `celilac_test_db`, dados proibidos e comandos permitidos/proibidos |
| 2026-07-17 | HARNESS-022 | Gap Analysis — Bloco 4: `AGENTS.md` com `FRONTEND_STRATEGY.md` e `ARCHITECTURE.md` na consulta obrigatória; Ações Autônomas expandidas para 8 exemplos práticos |
| 2026-07-17 | HARNESS-023 | Gap Analysis — Bloco 4: `harness/workflows.md` sincronizado com AGENTS.md (WF-03 Bug e WF-04 Banco adicionados); `harness/guardrails.md` expandido de 4 para 9 ações restritas |
| 2026-07-17 | HARNESS-024 | Gap Analysis — Bloco 5: `docs/HARNESS_EVALUATION.md` criado com auto-avaliação dos 11 critérios do PDF (§13); `docs/WORKSPACE_GUIDE.md` expandido com filosofia do harness |
| 2026-07-17 | FEAT-025 | Módulo de Parceiros Comerciais (Partners): entidade de domínio `Partner`, tabela `partners` com FK `partner_id` em `products`, rotas `POST /partners` e `GET /partners/me` |
| 2026-07-17 | FEAT-026 | Busca Avançada Filtrada: busca de produtos agora aceita `avoidAllergens`, `partnerId`, e calcula relatórios de compatibilidade dinâmicos para cada item |

Ver [README.md](README.md) para o estado atual das funcionalidades e [`docs/`](docs/) para as especificações de cada bounded context.
