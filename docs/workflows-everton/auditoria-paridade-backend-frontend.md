# Workflow: Auditoria de Paridade Backend x Frontend

Este workflow investiga funcionalidades que já existem na API (`backend`) mas que **nenhuma tela do frontend (`frontend/web-app`) consome ainda** — ou seja, endpoints "prontos" que ainda não viraram feature visível para o usuário.

## 1. Por que isso é possível de detectar neste monorepo

Duas convenções já existentes no projeto tornam essa comparação viável de forma automática:

1. **Backend previsível**: cada rota é registrada em um arquivo `*.routes.ts` dentro de [`backend/src/interfaces/http/routes/`](../../backend/src/interfaces/http/routes/), sempre chamando `router.get()/post()/put()/patch()/delete()` sobre uma instância `Router()` do Express. Esse router é então montado com um prefixo em [`backend/src/index.ts`](../../backend/src/index.ts) via `app.use('/prefixo', xRouter)`. A rota final é, na maioria dos casos, `prefixo + sub-rota` — com a exceção descrita na seção 4.
2. **Frontend centralizado**: por regra do próprio [`docs/FRONTEND_STRATEGY.md`](../FRONTEND_STRATEGY.md), *toda* chamada HTTP passa pela camada única em [`frontend/web-app/src/api/client.ts`](../../frontend/web-app/src/api/client.ts) (`apiClient.get/post/put/patch`), usada dentro de wrappers por módulo em `frontend/web-app/src/api/*.ts` (ex.: `catalogApi`, `partnerApi`, `foodProfileApi`). Nenhum componente, página ou contexto deve chamar `fetch()` diretamente — inclusive o `AuthContext` deste projeto não faz nenhuma chamada de rede (login/logout são resolvidos com o token já recebido e `sessionStorage`), então, ao contrário de outros projetos do time, **não há exceção conhecida** a essa regra hoje.

Este projeto também mantém um `docs/openapi.yaml` com os contratos documentados manualmente, mas ele não é gerado a partir do código (não há `swagger`/`openapi` no backend) — ou seja, pode divergir da implementação real. Por isso a auditoria lê o código-fonte diretamente (rotas Express + chamadas `apiClient`) em vez de confiar no YAML como fonte da verdade.

## 2. Estratégia

1. **Inventariar o backend**: percorrer `backend/src/interfaces/http/routes/*.routes.ts`, extrair cada chamada `router.<método>('<sub-rota>', ...)`, identificar o nome exportado do router do arquivo e cruzar com o prefixo montado em `app.use()` de `index.ts` para remontar o path completo. Rotas declaradas direto em `index.ts` (ex.: `GET /health`) também entram no inventário.
2. **Inventariar o frontend**: percorrer `frontend/web-app/src/api/*.ts` (exceto `client.ts`), extrair toda chamada `apiClient.<método>(...)`, capturando o path (primeiro argumento) e o método (nome do método chamado no `apiClient`). Como camada de segurança extra, o script também varre o resto de `frontend/web-app/src` procurando `fetch()` cru fora de `src/api/` — hoje não deveria haver nenhum, mas se aparecer é sinal de uma chamada nova que ainda não passou pela camada `apiClient`.
3. **Normalizar os paths** dos dois lados para permitir comparação: remover querystring, colapsar segmentos dinâmicos do Express (`:id`, `:userId`) e de template literal (`${courseId}`) para um placeholder genérico `:param`.
4. **Diferenciar os dois conjuntos** por `MÉTODO + path normalizado`. Toda rota do backend que não aparece no conjunto do frontend é uma **candidata** a gap.
5. **Nunca tratar a saída como veredito final** — é uma heurística estática baseada em regex linha a linha, não um parser de AST. Todo resultado passa por triagem manual (seção 5).

## 3. Como rodar

```bash
node scripts/audit-api-frontend-parity.mjs
```

Não tem dependências externas (Node puro, ESM). Não há `package.json` na raiz do monorepo (backend e frontend têm os seus próprios), então o script é executado diretamente com `node`, sem `pnpm`/`npm run`. Para salvar o relatório em vez de só imprimir no terminal:

```bash
node scripts/audit-api-frontend-parity.mjs > /tmp/paridade-$(date +%Y-%m-%d).md
```

A saída é um Markdown com:
- **Seção 1**: rotas do backend agrupadas por arquivo de rotas, sem chamada correspondente encontrada no frontend.
- **Seção 2** (bônus): chamadas do frontend que não bateram com nenhuma rota do backend — útil para achar typo de rota ou endpoint renomeado/removido no backend.

Avisos de rotas cujo router não foi encontrado em `app.use()` (ex.: arquivo de rotas criado mas ainda não plugado em `index.ts`) são impressos em `stderr`, separados do relatório em si.

## 4. Limitações conhecidas (leia antes de confiar cegamente)

- **Prefixo `/` não é "sem prefixo"**: [`partner.routes.ts`](../../backend/src/interfaces/http/routes/partner.routes.ts) e [`favorite.routes.ts`](../../backend/src/interfaces/http/routes/favorite.routes.ts) são montados em `app.use('/', xRouter)` — ou seja, o path completo já está escrito literalmente em cada `router.get/post(...)` do arquivo (inclusive misturando `/partners/...` e `/admin/partners` no mesmo arquivo). O script já trata esse caso (prefixo `/` não é concatenado, o path literal é usado como está), mas é a maior fonte de divergência em relação à premissa "prefixo + sub-rota" de outros monorepos — se um novo arquivo de rotas for montado em `/`, confira o path completo manualmente.
- **`apiClient` não tem método `delete` hoje**: [`client.ts`](../../frontend/web-app/src/api/client.ts) só expõe `get/post/put/patch`. Isso significa que nenhuma rota `DELETE` do backend (ex.: `DELETE /favorites/:targetId`) pode estruturalmente aparecer como "consumida" pelo script — se o time decidir implementar a tela de favoritos, o `apiClient` precisa ganhar um método `delete` antes.
- **Falsos positivos por dinamismo real**: se o frontend montar o path de forma indireta (função auxiliar que retorna a URL, path montado dentro de um `.map()`), o regex linha a linha pode não capturar. Sempre faça um `grep` manual do prefixo da rota antes de assumir que é gap real. Nenhum caso desse tipo foi encontrado na auditoria inicial (24/07/2026) — todos os wrappers em `src/api/*.ts` escrevem o path como string/template literal direto no argumento da chamada.
- **`docs/openapi.yaml` é mantido manualmente**: pode estar desatualizado em relação às rotas reais. Não use-o como referência para validar um gap — confie no código (`*.routes.ts` e `index.ts`).
- **Sem verificação de uso real em tela**: o script só confirma que a *chamada de API* existe em algum arquivo de `src/api/`; não garante que esse wrapper está de fato importado por um componente renderizado. Para esse nível de certeza, seria necessário rastrear import/uso do wrapper — fora do escopo desta heurística.
- **Endpoints consumidos por outro serviço, não pelo `frontend/web-app`**: nada nesta auditoria detecta chamadas feitas por `frontend/mobile-app`, `frontend/landing-page` ou scripts internos (`harness/scripts/`) — isso é validado manualmente (seção 5).

## 5. Como interpretar cada gap encontrado

Para cada linha da Seção 1 do relatório, classifique em uma destas categorias antes de agir:

| Categoria | O que significa | Ação |
|---|---|---|
| **Gap real de produto** | O endpoint implementa uma feature que deveria ter tela/fluxo no frontend e simplesmente ainda não foi feito | Abrir issue com `gh issue create --label enhancement`, referenciando o endpoint (método + rota) e o arquivo de rota do backend |
| **Endpoint técnico/interno** | Health-check (`GET /health`), ou outro endpoint de infraestrutura sem valor de produto direto | Documentar como exclusão conhecida (comentário no relatório); não abrir issue |
| **Consumido por outro app do monorepo** | Endpoint chamado por `frontend/mobile-app` ou `frontend/landing-page`, não pelo `web-app` | Confirmar com `grep` no app consumidor; sem ação no `web-app` |
| **Feature em andamento** | Já existe uma spec em [`docs/features/`](../features/) marcada como implementada no backend mas pendente no frontend, ou um item já registrado no backlog de [`PRDs/`](../../PRDs/) | Referenciar o doc de feature/PRD existente ao abrir a issue; não duplicar |
| **Código morto no backend** | Endpoint sem nenhum uso, sem spec relacionada, sem justificativa técnica — sobrou de uma implementação anterior ou de uma feature abandonada | Levantar com o time se deve ser removido (evitar deletar sem confirmação) |

Ao abrir issues a partir dos gaps confirmados, siga o fluxo de PR descrito em [`pr-local-develop.md`](../../.agents/workflows/pr-local-develop.md) para a implementação subsequente (sempre contra `develop`, nunca `main`, sempre com `thevingance` como revisor).

## 6. Quando rodar este workflow

- Antes de marcar uma feature como "concluída" em `docs/features/`, para conferir se todos os endpoints previstos já têm consumo na UI.
- Periodicamente, para identificar débito acumulado entre backend e frontend.
- Depois de um PR grande de backend, para garantir que nenhum endpoint novo ficou "órfão" de tela.

## 7. Resultado da primeira execução (24/07/2026)

Rodar `node scripts/audit-api-frontend-parity.mjs` hoje aponta 3 gaps reais de produto, já com feature documentada como implementada no backend em `docs/features/` mas sem nenhum wrapper em `frontend/web-app/src/api/`:

- **Favoritos** (`POST /favorites`, `GET /favorites`, `DELETE /favorites/:targetId`) — feature descrita em [`docs/features/favorites.md`](../features/favorites.md) como "✅ Implementado", mas não existe `favorites.ts` em `src/api/` nem tela de favoritos no `web-app`.
- **Denúncias/Moderação administrativa** (`POST/GET /admin/reports`, `PATCH /admin/reports/:id/status`) — feature descrita em [`docs/features/admin.md`](../features/admin.md) como "✅ Implementado", sem wrapper nem tela administrativa correspondente.
- **Avaliações (Reviews)** (`POST /reviews`, `GET /reviews/product/:productId`, `GET /reviews/partner/:partnerId`) — feature descrita em [`docs/features/reviews.md`](../features/reviews.md) como "IMPLEMENTADA", sem wrapper nem UI de avaliação.

Além disso, quatro rotas de `catalog.routes.ts` (`POST /catalog/products`, `GET /catalog/products/:id`, `PUT /catalog/products/:id`, `PATCH /catalog/products/:id/status`) aparecem sem consumo — o `catalogApi` atual só cobre busca (`search`/`listByPartner`). Vale checar com o time de parceiros se o cadastro/edição de produto já tem tela prevista antes de abrir issue.

`GET /health` é o único item que se enquadra em "endpoint técnico/interno" — não requer ação.
