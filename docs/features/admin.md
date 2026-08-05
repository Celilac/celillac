# Módulo de Administração (Moderação, Denúncias e Usuários)

## 📌 Status
✅ Implementado

## 📖 Descrição
Este módulo é responsável pela governança de dados do catálogo, controle de acesso de parceiros comerciais, moderação de contas de usuário e moderação de denúncias alimentares (Fluxo 15.5, passos 5-6). Ele permite que os consumidores reportem irregularidades ou riscos de alérgenos e fornece aos administradores ferramentas para:
1. Visualizar, filtrar e moderar denúncias de produtos e parceiros comerciais no Web App (`/admin/reports`).
2. Aprovar, suspender ou rejeitar cadastros de parceiros comerciais para liberação de publicações no catálogo (`/admin/partners`).
3. Listar e moderar a avaliação de perfil de usuários (`/admin/users`), permitindo inclusive a aprovação prévia de novos administradores.

## 🔗 Domínio
Regras de negócio conceituais sobre gestão e moderação podem ser encontradas em [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md).

## 🚀 Endpoints
Para contratos completos de request/response, consulte [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md).

| Método | Rota | Descrição | Restrição |
|:-------|:-----|:----------|:----------|
| `POST` | `/admin/reports` | Cria uma nova denúncia contra um produto ou parceiro comercial (`productId` ou `partnerId`). | Usuários Autenticados |
| `GET` | `/admin/reports` | Lista denúncias com filtros (`status`, `isFoodSafetyRisk`), priorizando denúncias de risco alimentar. | `ADMIN` (RBAC) |
| `PATCH` | `/admin/reports/:id/status` | Atualiza o status de uma denúncia (`PENDING`, `IN_REVIEW`, `RESOLVED`, `DISMISSED`). | `ADMIN` (RBAC) |
| `GET` | `/admin/partners` | Lista parceiros comerciais para moderação. | `ADMIN` (RBAC) |
| `POST` | `/partners/:id/approve` | Aprova um parceiro comercial. | `ADMIN` (RBAC) |
| `POST` | `/partners/:id/reject` | Rejeita o cadastro de um parceiro comercial (exige motivo no body). | `ADMIN` (RBAC) |
| `POST` | `/partners/:id/suspend` | Suspende temporariamente as operações de um parceiro. | `ADMIN` (RBAC) |
| `POST` | `/partners/:id/reactivate` | Reativa um parceiro suspenso. | `ADMIN` (RBAC) |
| `GET` | `/admin/users` | Lista usuários da plataforma para moderação. | `ADMIN` (RBAC) |
| `PATCH` | `/admin/users/:id/approve` | Aprova o cadastro de uma conta de Administrador. | `ADMIN` (RBAC) |
| `PATCH` | `/admin/users/:id/evaluate` | Altera a avaliação do perfil do usuário (`APPROVED`/`REJECTED`). | `ADMIN` (RBAC) |

## 💻 Interface do Usuário (Web App)
- **Moderação de Denúncias (`/admin/reports`)**:
  - **KPI Metrics Bar**: Visualização resumida em tempo real de Total Registrado, 🚨 Risco Alimentar (RN-15), ⏳ Pendentes, 🔍 Em Análise e ✅ Resolvidas.
  - **Pill Tab Filtering**: Filtros por pílulas de status e alternância direta para denúncias prioritárias de risco à saúde do celíaco.
  - **Bordas Laterais por Criticidade**: Codificação por cor (vermelho para risco alimentar, amarelo para pendente, azul para em análise, verde para resolvida).
  - **Modal Acessível de Histórico**: Exibição completa das descrições do consumidor, IDs do relator e links diretos para o produto/parceiro denunciado.
- **Trava de Segurança RBAC 403 Forbidden**:
  - Qualquer acesso de conta não-ADMIN (ex: `CELIACO`) a páginas administrativas exibe uma tela de bloqueio de segurança `🔒 Acesso Negado (403 Forbidden)`.

## 🏗️ Entidades Principais
- `Report`: Representa a denúncia feita por um usuário contra um produto ou parceiro comercial.
- `User`: Entidade de usuário com status de conta (`accountStatus`) e avaliação (`profileEvaluationStatus`).

### Value Objects
- `ReportStatus`: `PENDING` (padrão) | `IN_REVIEW` | `RESOLVED` | `DISMISSED`.
- `ReportReason`: `INCORRECT_INGREDIENTS` | `MISSING_ALLERGEN` | `WRONG_CROSS_CONTAMINATION` | `OTHER`.

## 🛡️ Regras Críticas (Application/Domain)
1. Uma vez que uma denúncia atinge um estado final (`RESOLVED` ou `DISMISSED`), seu status não pode ser alterado.
2. Todo reporte de falha de segurança alimentar entra como `PENDING` com `isFoodSafetyRisk = true`. Denúncias com risco de segurança alimentar possuem prioridade máxima na listagem administrativa (**RN-CONSUMER-15**).
3. Denúncias podem ser direcionadas a um produto (`productId`) ou a um parceiro comercial (`partnerId`) (**RN-CONSUMER-14**).
4. Todas as rotas sob o namespace `/admin/*` são protegidas por `adminOnlyMiddleware` e exigem obrigatoriamente que `req.user.role === 'ADMIN'`. Tentativas de acesso por consumidores retornam `403 Forbidden`.
5. Novos parceiros cadastrados entram como inativos (`isActive: false`) por padrão.
6. Apenas administradores têm permissão para aprovar ou suspender parceiros.
7. Administradores podem avaliar e alterar a aprovação do perfil de usuários a qualquer momento.
