# Módulo de Favoritos (Saved Favorites)

## 📌 Status
✅ Implementado (Backend & Frontend Web/Mobile)

## 📖 Descrição
Este módulo permite que os consumidores autenticados salvem produtos e parceiros comerciais (restaurantes, lojas, produtores) para acesso rápido e personalizado nas interfaces Web e Mobile.

## 🔗 Domínio
Regras de negócio conceituais sobre gestão de favoritos podem ser encontradas em [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md).

## 🚀 Endpoints
Para contratos completos de request/response, consulte [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md).

| Método | Rota | Descrição | Restrição |
|:-------|:-----|:----------|:----------|
| `POST` | `/favorites` | Adiciona um produto (`productId`) ou parceiro (`partnerId`) aos favoritos. | Usuários Autenticados |
| `DELETE` | `/favorites/:targetId` | Remove um item da lista de favoritos. | Usuários Autenticados |
| `GET` | `/favorites` | Lista todos os favoritos salvos pelo consumidor autenticado. | Usuários Autenticados |

## 🏗️ Entidades Principais
- `Favorite`: Entidade que representa a associação de preferência entre um consumidor e um produto ou parceiro comercial.

## 🛡️ Regras Críticas (Application/Domain)
1. Uma denúncia ou avaliação não afeta automaticamente o status de favorito.
2. Cada usuário pode favoritar um mesmo item no máximo uma vez.
3. Requisições sem `productId` nem `partnerId` são rejeitadas pelo UseCase.
