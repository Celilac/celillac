# Plano de Implementação — Mobile App focado no Consumidor

> **Branch sugerida:** `feat/mobile-consumer-parity` (a partir de `develop` atualizada, só após aprovação)
> **Escopo:** `frontend/mobile-app` (Flutter). Backend só muda se uma etapa disser explicitamente.
> **Status:** aguardando aprovação humana — nenhum código foi alterado.

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
