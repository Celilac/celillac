# Frontend — Web App + Landing Page

**Status:** ✅ Implementado
**Entregue em:** 2026-07-01 (Atualizado em 2026-07-28 — ver [CHANGELOG.md](../../CHANGELOG.md))
**Regras de interface:** [`docs/FRONTEND_STRATEGY.md`](../FRONTEND_STRATEGY.md)

## Web App (Next.js 14 — porta 3001)

| Rota | Descrição |
|:-----|:----------|
| `/` | Landing page / dashboard público |
| `/dashboard` | Dashboard do usuário para busca, verificação de compatibilidade e resumo de restrições |
| `/auth/register` | Cadastro de usuário com papéis |
| `/auth/login` | Login com autenticação JWT |
| `/auth/verify-email` | Verificação de e-mail por código OTP (6 dígitos) |
| `/profile` | Edição de dados pessoais (Nome, Nascimento, Gênero, Avatar até 10MB) e Perfil Alimentar |
| `/public-partners` | Catálogo público de parceiros comerciais ativos com busca e filtros |
| `/public-partners/[id]` | Detalhes do estabelecimento comercial com modal interativo e endereço |
| `/partner` | Portal de gestão e cadastro de produtos do parceiro comercial |
| `/admin/partners` | Painel de moderação e governança de parceiros (Aprovar/Rejeitar/Suspender) |
| `/admin/users` | Painel de moderação e avaliação de perfis de usuários pelo administrador |

### Jornada de Onboarding do Usuário (Novo Fluxo)

```
1. Cadastro (/auth/register)
      │
      ▼
2. Validação OTP (/auth/verify-email)
      │
      ▼
3. Preenchimento de Perfil (/profile)
      │
      ▼
4. Dashboard (/dashboard)
```

- **Passo 1 (Cadastro):** Usuário preenche e-mail, senha e nome. Ao registrar com sucesso, a sessão é autenticada e o usuário é redirecionado imediatamente para `/auth/verify-email`.
- **Passo 2 (Validação OTP):** O usuário informa o código de 6 dígitos. Após validação bem-sucedida, é redirecionado para `/profile`.
- **Passo 3 (Perfil):** O usuário completa data de nascimento, WhatsApp e suas restrições alimentares. Ao clicar em *Salvar alterações*, é redirecionado para `/dashboard`.

### Camada de API

```
src/api/                   ← ÚNICA camada autorizada a chamar o backend
├── client.ts              ← fetch base com interceptor JWT e tratamento de erros
├── iam.ts                 ← POST /iam/register | POST /iam/login | POST /iam/logout | GET/PUT /iam/profile
├── food-profile.ts        ← POST/GET/PUT /food-profile
├── compatibility.ts       ← POST /compatibility/check
├── catalog.ts             ← GET /catalog/products (busca de produtos) | POST/PUT/PATCH
├── partner.ts             ← POST/GET/PATCH /partners
├── reviews.ts             ← GET/POST /reviews
└── favorites.ts           ← GET/POST/DELETE /favorites
```

> ⚠️ **Regra Fundamental:** O `AllergenEngine` reside **exclusivamente no backend**. O frontend **nunca** recalcula compatibilidade — sempre consulta `POST /compatibility/check`.

## Landing Page (Next.js 14 — porta 3002)

- Output estático (`next export`) — isolada da aplicação principal
- Seções: Hero, Stats, Como Funciona, Demo de Riscos, CTA, Footer
- SEO: title, meta description, Open Graph, heading hierarchy
- Zero chamadas de API
