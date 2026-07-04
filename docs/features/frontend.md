# Frontend — Web App + Landing Page

**Status:** ✅ Implementado
**Entregue em:** 2026-07-01 (ver [CHANGELOG.md](../../CHANGELOG.md))
**Regras de interface:** [`docs/FRONTEND_STRATEGY.md`](../FRONTEND_STRATEGY.md)

## Web App (Next.js 14 — porta 3001)

| Rota | Descrição |
|:-----|:----------|
| `/` | Dashboard com verificações recentes |
| `/auth/register` | Cadastro de usuário |
| `/auth/login` | Login |
| `/profile` | Configuração do Perfil Alimentar |

### Camada de API

```
src/api/                   ← ÚNICA camada autorizada a chamar o backend
├── client.ts              ← fetch base com regra arquitetural documentada
├── iam.ts                 ← POST /iam/register | POST /iam/login
├── food-profile.ts        ← POST/GET/PUT /food-profile
└── compatibility.ts       ← POST /compatibility/check
```

> ⚠️ **Regra Fundamental:** O `AllergenEngine` reside **exclusivamente no backend**. O frontend **nunca** recalcula compatibilidade — sempre consulta `POST /compatibility/check`.

## Landing Page (Next.js 14 — porta 3002)

- Output estático (`next export`) — isolada da aplicação principal
- Seções: Hero, Stats, Como Funciona, Demo de Riscos, CTA, Footer
- SEO: title, meta description, Open Graph, heading hierarchy
- Zero chamadas de API
