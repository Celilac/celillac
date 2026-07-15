# Changelog — CeLiLac

Histórico de entregas do projeto. Formato: `Data | Feature | Descrição`.

| Data | Feature | Descrição |
|:-----|:--------|:----------|
| 2026-06-29 | FEAT-001 | Módulo IAM completo (22 testes) |
| 2026-06-30 | FEAT-002 | Perfil Alimentar (`FoodProfile` + `Restriction`) |
| 2026-06-30 | FEAT-003 | Motor de Alérgenos com 9 casos críticos |
| 2026-07-01 | FEAT-004 | Frontend Web App + Landing Page (Next.js 14) |
| 2026-07-01 | FEAT-002 | `UpdateFoodProfileUseCase` — atualização de restrições via `PUT /food-profile/:userId` |
| 2026-07-01 | FEAT-003 | Endpoint `POST /compatibility/check` exposto na API |
| 2026-07-01 | FEAT-005 | Bounded Context Catálogo de Produtos (`CreateProduct`, `SearchProducts`) |
| 2026-07-04 | FEAT-007 | Início das Interfaces: Dashboard Web (UI Glassmorphism) e Scaffolding App Mobile (Expo) |
| 2026-07-04 | FEAT-006 | Implementação do módulo de Administração e Moderação |
| 2026-07-04 | FEAT-008 | Bounded Context de Avaliações (Social Proof) e Pipeline de Automação CI/CD |
| 2026-07-07 | FEAT-009 | App Mobile completo (React Native + Expo): Auth JWT persistido via expo-secure-store, Scanner EAN, Busca, Perfil Alimentar e Alertas visuais por risco |
| 2026-07-07 | FEAT-010 | Middleware de Autenticação JWT no Backend (Express), mitigação de IDOR/BOLA (403 Forbidden), tratamento global de erros (500) e cabeçalhos de segurança OWASP/CORS |
| 2026-07-07 | FEAT-011 | Docker Compose (Full-Stack Dockerization): containerização do backend e do web-app com PostgreSQL e persistência de dados local configurada. |
| 2026-07-07 | FEAT-012 | Identidade Visual & Temas: paleta de cores institucional, suporte completo a temas claro/escuro e estilização global no Web App. |
| 2026-07-07 | FEAT-013 | Painel de Marca no Login/Registro: layout split-screen com painel de marca promocional adaptivo e topbar simplificada nas páginas de login e cadastro. |
| 2026-07-07 | BUGFIX-014 | Correções e estabilização do Web App (upsert de perfil, correção do HTTP client / headers, persistência de sessão segura via sessionStorage) e correção do parâmetro de busca no backend (`query` vs `q`). |
| 2026-07-12 | BUGFIX-015 | Correção de sintaxe JSX e conflito de mesclagem na página de perfil no Web App |

Ver [README.md](README.md) para o estado atual das funcionalidades e [`docs/`](docs/) para as especificações de cada bounded context.

