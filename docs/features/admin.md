# Módulo de Administração (Moderação, Denúncias e Usuários)

## 📌 Status
✅ Implementado

## 📖 Descrição
Este módulo é responsável pela governança de dados do catálogo, controle de acesso de parceiros comerciais e moderação de contas de usuário. Ele permite que os usuários reportem produtos com informações imprecisas e fornece aos administradores ferramentas para:
1. Revisar e aprovar/recusar denúncias de produtos.
2. Aprovar, suspender ou banir cadastros de parceiros comerciais para liberação de publicações no catálogo.
3. Listar e moderar a avaliação de perfil de usuários (`APPROVED` / `REJECTED`), permitindo inclusive a reavaliação de rejeições acidentais.

## 🔗 Domínio
Regras de negócio conceituais sobre gestão e moderação podem ser encontradas em [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md).

## 🚀 Endpoints
Para contratos completos de request/response, consulte [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md).

| Método | Rota | Descrição | Restrição |
|:-------|:-----|:----------|:----------|
| `POST` | `/admin/reports` | Cria uma nova denúncia contra um produto ou parceiro comercial (`productId` ou `partnerId`). | Usuários Autenticados |
| `GET` | `/admin/reports` | Lista denúncias com filtros (`status`, `isFoodSafetyRisk`), priorizando denúncias de risco alimentar. | `ADMIN` |
| `PATCH` | `/admin/reports/:id/status` | Atualiza o status de uma denúncia. | `ADMIN` |
| `PATCH` | `/partners/:id/status` | Altera status de aprovação de parceiro. | `ADMIN` |
| `GET` | `/admin/users` | Lista usuários da plataforma para moderação. | `ADMIN` |
| `PATCH` | `/admin/users/:id/evaluate` | Altera a avaliação do perfil do usuário (`APPROVED`/`REJECTED`). | `ADMIN` |

## 🏗️ Entidades Principais
- `Report`: Representa a denúncia feita por um usuário contra um produto ou parceiro comercial.
- `User`: Entidade de usuário com status de avaliação (`profileEvaluationStatus`).

### Value Objects
- `ReportStatus`: `PENDING` (padrão) | `IN_REVIEW` | `RESOLVED` | `DISMISSED`.
- `ReportReason`: `INCORRECT_INGREDIENTS` | `MISSING_ALLERGEN` | `WRONG_CROSS_CONTAMINATION` | `OTHER`.

## 🛡️ Regras Críticas (Application/Domain)
1. Uma vez que uma denúncia atinge um estado final (`RESOLVED` ou `DISMISSED`), seu status não pode ser alterado.
2. Todo reporte de falha de segurança alimentar entra como `PENDING` com `isFoodSafetyRisk = true`. Denúncias com risco de segurança alimentar possuem prioridade máxima na listagem administrativa (**RN-CONSUMER-15**).
3. Denúncias podem ser direcionadas a um produto (`productId`) ou a um parceiro comercial (`partnerId`) (**RN-CONSUMER-14**).
4. Novos parceiros cadastrados entram como inativos (`isActive: false`) por padrão.
5. Apenas administradores têm permissão para aprovar ou suspender parceiros.
6. Administradores podem avaliar e alterar a aprovação do perfil de usuários a qualquer momento.
