# Feature: Avaliações e Confiança (Social Proof)

**Status**: IMPLEMENTADA (Última atualização: 2026-07-18)

## Descrição
Para garantir a segurança da comunidade, implementamos um sistema de avaliações de rótulos e estabelecimentos. Celíacos e pessoas com restrição podem avaliar a confiabilidade de produtos e de parceiros comerciais (restaurantes, mercados, produtores).

## Casos de Uso
1. **Submeter Avaliação**: Recebe um `userId`, `rating` (1 a 5), `comment` e opcionalmente um `productId` ou `partnerId`. Um usuário pode avaliar o mesmo alvo apenas uma vez (caso tente novamente, será atualizado via Upsert).
2. **Listar Avaliações por Produto**: Traz o total de avaliações de um produto e a média de notas.
3. **Listar Avaliações por Parceiro**: Traz as avaliações recebidas por um estabelecimento/parceiro.

## Endpoints

| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| POST | `/reviews` | Cria ou atualiza uma avaliação (de produto ou parceiro) | Implementado |
| GET | `/reviews/product/{productId}` | Retorna as avaliações de um produto | Implementado |
| GET | `/reviews/partner/{partnerId}` | Retorna as avaliações de um parceiro comercial | Implementado |

## Referência de Domínio
Consulte a Seção 5 de [DOMAIN_MODEL.md](../DOMAIN_MODEL.md) para regras completas.

