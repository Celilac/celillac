# Plano de Implementação — Mobile App focado no Consumidor

> **Branch sugerida:** `feat/mobile-consumer-parity` (a partir de `develop` atualizada, só após aprovação)
> **Escopo:** `frontend/mobile-app` (Flutter). Backend só muda se uma etapa disser explicitamente.
> **Status:** Etapas 0–4 entregues (FEAT-116 a FEAT-120). Etapas 5 (Pedidos), 6 (Checkout) e 7 (Início/Dashboard) detalhadas na §9 — **aguardando aprovação humana, nenhum código foi alterado.**

## 1. Objetivo

O app mobile atende **somente o consumidor** (celíaco / pessoa com restrição alimentar). Papéis `PARTNER` e `ADMIN` ficam fora: continuam no web-app. Meta: paridade com a jornada de consumidor do web-app, mantendo a regra de ouro de `docs/FRONTEND_STRATEGY.md`: **o app só exibe o veredito do `AllergenEngine`, nunca calcula**.

## 2. O que o web-app tem para o consumidor (e o que fica de fora)

| Área web | Rota | Escopo mobile |
|:--|:--|:--|
| Home / busca com filtros | `/`, `/dashboard` | ✅ |
| Detalhe do produto + compatibilidade | `/products/[id]` | ✅ |
| Favoritos | `/favorites` | ✅ |
| Parceiros públicos (lista + detalhe + produtos) | `/public-partners` | ✅ |
| Pedidos (lista, cancelar) | `/orders` | ✅ |
| Checkout / pagamento | `/checkout/[orderId]` | ✅ (ver decisão D1) |
| Perfil, perfil alimentar, status | `/profile` | ✅ (parte consumidor) |
| Auth completo (verificar e-mail, esqueci/redefinir senha) | `/auth/*` | ✅ |
| Termos / Privacidade | `/termos`, `/privacidade` | ✅ |
| Notificações de pedido | `Header` + SSE | ✅ (ver decisão D2) |
| Cadastro/gestão de parceiro, financeiro, pedidos do parceiro | `/partner/*` | ❌ fora |
| Admin (usuários, categorias, certificações, denúncias) | `/admin/*` | ❌ fora |

## 3. O que o mobile já tem (`lib/`)

- Auth: login, registro (sem verificação de e-mail, sem recuperar senha, sem consentimento LGPD).
- Onboarding de perfil alimentar + editar perfil.
- Scanner EAN-13/8, busca simples, detalhe de produto com `AlertBanner` (compatibilidade), avaliar, denunciar.
- Favoritos (produto e parceiro).
- `ApiClient` com: register, login, food-profile, catálogo, compatibilidade, favoritos, reviews, reports.
- Tema só dark; abas da navegação usam **emoji** como ícone.

## 4. Lacunas encontradas (base para as etapas)

1. **Base URL fixa em `localhost:3002`** ([api_client.dart:25](frontend/mobile-app/lib/api/api_client.dart#L25)). Produção deve usar `https://api.celilac.com.br` (regra de resiliência do AGENTS.md).
2. Sem `ordersApi`, `paymentsApi`, `partnerApi` (listagem pública), `iamApi` (verify/reset), `/consumer/*`.
3. Sem telas de parceiros, pedidos, checkout, notificações.
4. Sem LGPD Art. 11 no cadastro, sem termos/privacidade.
5. Detalhe de produto sem galeria de imagens, info nutricional, certificações, badges `PJ/PF`.
6. Sem pictogramas internacionais de alérgenos (roadmap §2.1).
7. Navegação com emojis; sem tema claro (web tem `ThemeContext`).
8. Sem guarda de papel: um usuário `PARTNER`/`ADMIN` logaria no app de consumidor.
9. Testes só em `test/{api,core,shared}`; nenhuma feature testada.

## 5. Etapas (cada uma = PR pequeno, `npm`/`flutter analyze` + `flutter test` verdes)

### Etapa 0 — Fundação
- Base URL por `--dart-define=API_BASE_URL` (default dev por plataforma; produção `https://api.celilac.com.br`). Mensagem "Serviço temporariamente indisponível..." para erro de rede/502/503.
- Guarda de papel: após login, se `role != CONSUMER`, mostrar tela "Use o painel web" e encerrar sessão.
- Navegação por `BottomNavigationBar` com `Icons` (remover emojis), preparada para novas abas.
- Estrutura de roteamento (`Navigator` simples, sem lib nova) e padrão de estado (`provider`, já existente).
- Testes: `ApiClient` (base URL, 502/503), guarda de papel.

### Etapa 1 — Conta e conformidade
- Verificação de e-mail (`/iam/email-verification/*`), esqueci/redefinir senha (`/iam/password-reset/*`).
- Checkbox obrigatório de consentimento LGPD Art. 11 no registro.
- Telas Termos de Uso e Privacidade (texto estático **sem alterar o conteúdo** — alteração exige aprovação).
- Testes de widget dos formulários.

### Etapa 2 — Perfil do consumidor
- `GET /consumer/me`, `PATCH /consumer/status` (ativar/desativar), `POST/DELETE /consumer/restrictions`.
- Pictogramas internacionais de alérgenos (glúten/AOECS, leite) — ver D3.
- Exibir `hasIncompleteProfileWarning` e status do perfil como vem da API.

### Etapa 3 — Descoberta de produtos
- Home com busca, filtros (espelhar `productFilters.ts` via parâmetros da API, sem filtro de segurança local) e "verificados recentemente" (`recentChecks`, armazenamento local).
- Detalhe do produto: carrossel de imagens/rótulos/laudos, info nutricional, certificações, características dietéticas, avaliações.
- Veredito sempre via `POST /compatibility/check` → `AlertBanner`.

### Etapa 4 — Parceiros públicos
- Lista (`GET /partners`) e detalhe com produtos do parceiro, badge `PJ • Empresa` / `PF • Produtor`, status operacional, avaliações, favoritar, denunciar.
- Mapa/endereço: abrir app de mapas externo (ver D4).

### Etapa 5 — Pedidos e pagamento
- Criar pedido a partir do produto/parceiro (`POST /orders`), lista (`GET /orders/me`), detalhe, cancelar.
- Checkout: PIX (QR + copia-e-cola, `GET /payments/order/:id` com polling até `PAID`), dinheiro/cartão na entrega. Cartão de crédito online: ver D1.
- Exibir `allergenCheckVerdict` retornado pelo pedido (sem recalcular).
- Carrinho multi-itens fica **fora** até existir no web (roadmap §1.3).

### Etapa 6 — Notificações de pedido
- Ver D2. Mínimo: atualização de status por polling leve na tela de pedidos; evolução: SSE/push quando o backend entregar o canal autenticado (roadmap §1.1).
- Confirmação de entrega + avaliação pós-entrega quando `PATCH /orders/:id/confirm-delivery` existir (roadmap §1.2).

### Etapa 7 — Acabamento e release
- Tema claro/escuro, acessibilidade (semantics, contraste, fontes grandes), estados de loading/erro/vazio padronizados.
- Ícones e splash revisados (derivam de `assets/brand/logo.png`).
- Cobertura de testes nas features; `flutter analyze` limpo.
- Docs: `docs/features/mobile-app.md`, `README.md` (link), `CHANGELOG.md`, `docs/API_CONTRACTS.md` se algum contrato mudar.

## 6. Dependências novas (exigem aprovação — AGENTS.md)

Nenhuma é instalada sem o seu "ok". Propostas, por etapa:

| Pacote | Etapa | Para quê |
|:--|:--|:--|
| `cached_network_image` | 3 | Cache de imagens de produto/rótulo |
| `flutter_svg` | 2 | Pictogramas vetoriais |
| `url_launcher` | 4 | Abrir mapas / telefone |

## 7. Decisões (recomendações adotadas pelo usuário)

- **D1 — Pagamento:** PIX (QR do `pixQrCode` + copia-e-cola) e dinheiro/cartão na entrega. Cartão de crédito online fica fora desta fase (evita SDK/tokenização do Asaas no mobile).
- **D2 — Notificações:** polling leve na tela de pedidos agora; SSE/push só quando o backend entregar `GET /notifications/stream`. Sem Firebase.
- **D3 — Pictogramas:** ícones provisórios em SVG local (`assets/icons/allergens/`), trocáveis pelos oficiais AOECS/ACELBRA sem mudar código.
- **D4 — Localização:** apenas abrir endereço no mapa externo. Sem GPS nem busca por proximidade.
- **Ordem:** 0 → 7 conforme as etapas.
- **Dependências a instalar (aguardam "ok" explícito):** `cached_network_image`, `flutter_svg`, `url_launcher`. Não entram: `qr_flutter`, `firebase_messaging`.

## 8. Restrições respeitadas

- Nenhuma alteração no `ALLERGEN_ENGINE`, auth/JWT, migrations, CORS/rate limit ou termos.
- Sem lógica de segurança alimentar no app; sem contratos de API alterados sem atualizar `API_CONTRACTS.md`.
- Token JWT permanece em `flutter_secure_storage`.
- Mudanças de UI serão testadas por você (não subo dev server/emulador).


---

## 9. Detalhamento das próximas etapas (pedidos, checkout, dashboard)

> Escopo: `frontend/mobile-app`. Sem mudanças de backend, `AllergenEngine`, auth/JWT, migrations ou CORS. Novas dependências: **nenhuma** (QR do PIX é exibido a partir de `pixQrCode`, com `Image.network` ou `Image.memory` conforme o formato; copia-e-cola via `Clipboard`). Cada etapa = uma branch `feat/mobile-<nome>` a partir de `develop`, um PR, `flutter analyze` e `flutter test` verdes. Ordem: 5 → 6 → 7 (o checkout depende da lista/detalhe de pedidos; o início agrega pedidos).

> Nota de numeração: as Etapas 5–7 da §5 original (pedidos e pagamento / notificações / acabamento) foram reorganizadas aqui; "Notificações" passa a ser parte da Etapa 5 (polling) e "Acabamento" vira a Etapa 8.

### 9.1 Fatos levantados (web e contrato)

- **Web:** `orders/page.tsx` (lista, pagar, cancelar com motivo), `checkout/[orderId]/page.tsx` (PIX com polling, entrega, cartão), `dashboard/page.tsx` (perfil/restrições, busca, produtos, veredito por produto).
- **Divergência de contrato (confirmada no código do backend, sem subir a stack):** `API_CONTRACTS.md` §14/§15 está defasado. O que o backend realmente produz (`domain/order/entities/Order.ts`, `OrderItem.ts`, `CheckoutOrderUseCase.ts`, `Payment.ts`):
  - Pedido: `subtotalAmount`, `deliveryFee`, `totalAmount`, `allergenCheckVerdict` (`SAFE`|`WARNING`), `notes`, `paymentMethod`, `changeFor`, `cancelledAt`, `cancelReason`, `createdAt`, `updatedAt`, `items[]` com `productId`, `productName`, `unitPrice`, `quantity`, `totalPrice`. **Não** há `orderNumber`, `subtotal`/`total`, `itemsCount` nem `isRefundEligible` nessa entidade.
  - Checkout: `paymentId`, `orderId`, `method`, `status`, `grossAmount`, `netPartnerAmount`, `platformFeeAmount`, `changeFor`, **`pixQrCode`**, `pixCopyPaste`, **`pixExpiresAt`** (o contrato diz `pixQrCodeUrl`/`platformFee`/`expiresAt`).
  - Pagamento (`GET /payments/order/:id`): `status`, `pixQrCode`, `paidAt` etc.
  - Falta confirmar só o **envelope** de resposta (`{success,data}` vs objeto direto) e o `Content` de `pixQrCode` (URL ou base64): fazer no início da Etapa 5 com a stack local no ar, lendo uma resposta real. Até lá o parse do mobile aceita os dois envelopes.
  - Ação: corrigir `API_CONTRACTS.md` §14/§15 junto da Etapa 5 (você autorizou capturar as respostas; a correção do contrato entra no PR da etapa).
- O web ainda oferece `CREDIT_CARD`, que não está no contrato; o mobile não o implementa (D1).
- **Sem carrinho multi-itens no web** (roadmap §1.3): o pedido nasce de um produto/parceiro, com `partnerId` único (`CROSS_PARTNER_ITEMS_FORBIDDEN`).
- **SSE `GET /orders/stream`** existe, mas é voltado ao parceiro; decisão D2 mantém polling leve no mobile.
- **Pagamento online por cartão:** fora (D1). PIX + dinheiro/cartão na entrega.

### 9.2 Etapa 5 — Pedidos (`feat/mobile-orders`)

**Objetivo:** consumidor cria, acompanha e cancela pedidos.

| Fluxo | Tela / Widget | Endpoint | Regras |
|:--|:--|:--|:--|
| Criar pedido | botão "Fazer pedido" em `ProductDetailsScreen` e itens do `PartnerDetailsScreen` → `CreateOrderScreen` | `POST /orders` | Item único + quantidade, observações; **`FOOD_SAFETY_RISK_BLOCK` (400) é exibido como o veredito do backend** (banner `BLOCKED`), nunca contornado nem recalculado |
| Lista | nova aba **Pedidos** (`OrdersScreen`) | `GET /orders/me` | Estados loading/erro/vazio, *pull to refresh*, polling leve (ex.: 20 s só com a aba visível e pedidos em andamento) |
| Detalhe | `OrderDetailsScreen` | `GET /orders/:id` | Itens, totais, status em linguagem clara, `allergenCheckVerdict` **como veio** (SAFE → "Verificado seguro"; WARNING → "Atenção: traços"), motivo do cancelamento |
| Cancelar | diálogo com motivo | `POST /orders/:id/cancel` | Só para `CREATED`/`AWAITING_PAYMENT`/`PAID`; texto de estorno só quando a API indicar elegibilidade |
| Pagar | botão "Pagar" em pedidos `CREATED`/`AWAITING_PAYMENT` | navega à Etapa 6 | — |

- Camada de API: `ordersApi` no `ApiClient` (`createOrder`, `getMyOrders`, `getOrderById`, `cancelOrder`); models em `lib/api/models/order_models.dart` (parse tolerante: aceita `totalAmount`/`total`).
- Erros: `OrderErrorMessages` (502/503/rede → serviço indisponível; 400 de domínio → mensagem do backend só para códigos conhecidos; nunca texto técnico).
- Guarda: parceiro/admin não chegam (guarda de papel da Etapa 0).
- Testes (TDD): parse dos models com os dois formatos; `ApiClient` (paths, bodies, erros); widgets de lista (3 estados + polling para quando não há pedido em andamento), detalhe, cancelamento, criação com `FOOD_SAFETY_RISK_BLOCK`.
- Docs: `docs/features/mobile-app.md` (§9), `CHANGELOG.md` (FEAT-121), contrato corrigido em `API_CONTRACTS.md` §14 se confirmado.

### 9.3 Etapa 6 — Checkout e pagamento (`feat/mobile-checkout`)

**Objetivo:** pagar um pedido por PIX ou na entrega.

| Fluxo | Endpoint | Regras |
|:--|:--|:--|
| Escolher método | — | PIX · Dinheiro na entrega · Cartão (maquininha) na entrega. Se `can_pay_on_delivery = false`, a API devolve 400 → mostrar "pague antecipadamente online" e destacar PIX |
| PIX | `POST /payments/checkout` `{orderId, method:'PIX'}` | Exibe QR (`pixQrCode`; imagem ou base64, a confirmar), copia-e-cola (com botão copiar), valor e expiração; endpoint é idempotente (reabrir não duplica) |
| Acompanhar PIX | `GET /payments/order/:orderId` | Polling a cada 5 s até `PAID` (→ tela de sucesso) ou `CANCELLED`/expirado (→ oferecer gerar novo QR); para ao sair da tela |
| Dinheiro | `POST /payments/checkout` `{method:'CASH_ON_DELIVERY', changeFor?}` | Valida no cliente apenas formato; `changeFor < total` → erro amigável (regra duplicada do web, só UX; o backend é a fonte da verdade) |
| Cartão na entrega | `POST /payments/checkout` `{method:'CARD_ON_DELIVERY'}` | — |

- `paymentsApi` no `ApiClient` (`checkout`, `getPaymentByOrder`); `payment_models.dart`.
- Resumo do pedido e `allergenCheckVerdict` reaproveitam os widgets da Etapa 5.
- Segurança: nada de dados de cartão no app (D1); QR/copia-e-cola não são logados nem persistidos; mensagens genéricas para falha do gateway.
- Ciclo de vida: `Timer` cancelado no `dispose` e quando o app vai para segundo plano (`WidgetsBindingObserver`).
- Testes: seleção de método, PIX (render + copiar + polling com relógio falso até `PAID`/`CANCELLED`), troco inválido, restrição de pagamento na entrega, erros 502/503.
- Docs: `mobile-app.md` (§10), `CHANGELOG.md` (FEAT-122), `API_CONTRACTS.md` §15 (campos reais, ex.: `pixQrCode`/`pixCopyPaste`/`pixExpiresAt`).

### 9.4 Etapa 7 — Início (dashboard do consumidor) (`feat/mobile-home-dashboard`)

**Objetivo:** paridade com a parte consumidor de `/dashboard`, em formato de tela inicial.

- Nova aba **Início** (primeira aba), com: saudação; avisos de **perfil incompleto** (`hasIncompleteProfileWarning`) e **e-mail não verificado** (com atalho para verificar); **resumo do perfil alimentar** (restrições com severidade, `acceptsCrossContamination`, como vêm da API — chips já existentes); **atalhos** (Scanner, Buscar, Parceiros); **pedidos em andamento** (de `GET /orders/me`, com atalho ao detalhe/pagamento); **verificados recentemente** (storage local já existente, sem veredito).
- Fora do escopo: criação/edição de produtos e blocos de parceiro do web (papéis PARCEIRO/ADMIN); filtros avançados (já na busca).
- Veredito de produto continua só no detalhe via `POST /compatibility/check`; o Início **não** mostra risco por produto.
- Endpoints: `GET /consumer/me`, `GET /iam/me`, `GET /orders/me`. Cada bloco carrega de forma independente (falha de um não derruba a tela).
- Testes: cada bloco (loading/erro/vazio/preenchido), avisos condicionais, navegação dos atalhos.
- Docs: `mobile-app.md` (§11), `CHANGELOG.md` (FEAT-123).

### 9.5 Decisões

(Confirmadas pelo usuário em 2026-11-13.) Captura de respostas reais autorizada; 1 produto por pedido; aba Início própria; `deliveryFee`/`deliveryAddress` iguais ao web.
