# Módulo de Administração (Moderação e Denúncias)

## 📌 Status
✅ Implementado

## 📖 Descrição
Este módulo é responsável pela governança de dados do catálogo e controle de acesso de parceiros comerciais. Ele permite que os usuários reportem produtos com informações imprecisas e fornece aos administradores ferramentas para:
1. Revisar e aprovar/recusar denúncias de produtos.
2. Aprovar, suspender ou banir cadastros de parceiros comerciais para liberação de publicações no catálogo.

## 🔗 Domínio
Regras de negócio conceituais sobre gestão e moderação de denúncias podem ser encontradas em [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md).

## 🚀 Endpoints
Para contratos completos de request/response, consulte [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md).

| Método | Rota | Descrição | Restrição |
|:-------|:-----|:----------|:----------|
| `POST` | `/admin/reports` | Cria uma nova denúncia contra um produto. | Usuários Autenticados |
| `GET` | `/admin/reports` | Lista denúncias com filtros (ex: status). | `ADMIN` |
| `PATCH` | `/admin/reports/:id/status` | Atualiza o status de uma denúncia. | `ADMIN` |
| `PATCH` | `/partners/:id/status` | Altera status de aprovação de parceiro. | `ADMIN` |

## 🏗️ Entidades Principais
- `Report`: Representa a denúncia feita por um usuário.

### Value Objects
- `ReportStatus`: `PENDING` (padrão) | `IN_REVIEW` | `RESOLVED` | `DISMISSED`.
- `ReportReason`: `INCORRECT_INGREDIENTS` | `MISSING_ALLERGEN` | `WRONG_CROSS_CONTAMINATION` | `OTHER`.

## 🛡️ Regras Críticas (Application/Domain)
1. Uma vez que uma denúncia atinge um estado final (`RESOLVED` ou `DISMISSED`), seu status não pode ser alterado, evitando falsificações do histórico de moderação.
2. Todo reporte de falha de segurança alimentar entra como `PENDING`.
3. Novos parceiros cadastrados entram como inativos (`isActive: false`) por padrão.
4. Apenas administradores têm permissão para aprovar (`isActive: true`) ou suspender parceiros.
5. Parceiros inativos não têm permissão de cadastrar produtos no catálogo.

