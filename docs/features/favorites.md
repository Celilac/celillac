# Feature: Favoritos (RF19)

**Status:** ✅ Implementado
**Entregue em:** 2026-07-18
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)

## Descrição
Permite que consumidores autenticados favoritem tanto produtos individuais quanto parceiros comerciais (estabelecimentos) para acesso rápido no perfil do usuário.

## Endpoints

| Método | Rota | Autenticação | Descrição |
|:-------|:-----|:------------:|:----------|
| `POST` | `/favorites` | Sim | Adiciona um produto ou parceiro comercial aos favoritos |
| `DELETE`| `/favorites/:targetId` | Sim | Remove a associação de favoritos |
| `GET`  | `/favorites` | Sim | Retorna a lista de favoritos do usuário autenticado |

## Domínio e Entidades
- `Favorite`: Entidade que representa o vínculo de favorito.
- Validação: O favorito deve possuir o `userId` e pelo menos um alvo válido (`productId` ou `partnerId`).

## Banco de Dados
Mapeado na tabela `user_favorites` (migration `008`):
- `id` UUID PK
- `user_id` UUID FK -> users
- `product_id` UUID FK -> products (nullable)
- `partner_id` UUID FK -> partners (nullable)
- Constraints de unicidade para evitar duplicados por usuário por alvo.

## Testes

- `backend/tests/unit/domain/favorites/Favorite.spec.ts`
- `backend/tests/unit/application/favorites/FavoriteUseCases.spec.ts`
