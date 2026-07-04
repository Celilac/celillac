# Feature: Avaliações e Confiança (Social Proof)

**Status**: IMPLEMENTADA

## Descrição
Para garantir a segurança da comunidade, implementamos um sistema de avaliações de rótulos. Celíacos e pessoas com restrição podem votar e dar estrelas em relação à veracidade do rótulo e de fato, relatar a confiabilidade do produto.

## Casos de Uso
1. **Submeter Avaliação**: Recebe um `productId`, `userId`, `rating` (1 a 5) e `comment`. Um usuário pode avaliar um produto apenas uma vez, caso tente novamente a avaliação será atualizada (Upsert).
2. **Listar Avaliações**: Traz o total de reviews de um produto, e a média de notas.

## Endpoints

| Método | Rota | Descrição | Status |
|--------|------|-----------|--------|
| POST | `/reviews` | Cria ou atualiza uma avaliação de um produto | Implementado |
| GET | `/reviews/product/{productId}` | Retorna as estatísticas de avaliações | Implementado |

## Referência de Domínio
Consulte a Seção 5 de [DOMAIN_MODEL.md](../DOMAIN_MODEL.md) para regras completas.
