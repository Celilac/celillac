# BUGFIX — Vazamento do contexto Consumer na tela `/profile` para usuários Partner

> **Status:** Identificado, aguardando implementação
> **Severidade:** Alta (violação de domínio + experiência quebrada para todo usuário `PARCEIRO`)
> **Referência de domínio:** [`PRDs/Análise de Partner no CeliLac.md`](../PRDs/Análise%20de%20Partner%20no%20CeliLac.md) (§15.4), [`docs/DOMAIN_MODEL.md`](DOMAIN_MODEL.md) (§3, §10)
> **Issue relacionada:** abrir com referência a este documento (padrão do projeto — ver `CHANGELOG.md`)

---

## 1. Resumo do problema

Após concluir o cadastro como **Partner**, o usuário responsável clica em **"Perfil"** no menu superior e cai em uma tela chamada "Meu Perfil" que é **inteiramente do domínio Consumer**: restrições alimentares, severidade, alergia, "Aceito risco de contaminação cruzada" e um card "Status do Consumidor: ATIVO" com botão "Desativar Perfil".

Nenhum desses conceitos pertence ao agregado `Partner`. Isso não é um problema estético — é uma inconsistência de modelagem já documentada e cujo caminho de correção **já existe no próprio código**, só não foi replicado para esta tela.

### Evidência (captura fornecida pelo usuário)

Usuário logado como `PARCEIRO`, cadastro pendente de avaliação, navega para `/profile` e vê:
- 🔴 "Status do Consumidor: ATIVO" + botão "Desativar Perfil"
- 🔴 Seção "Restrições alimentares" (Glúten, Fatal — Celíaco, Alergia)
- 🔴 "Aceito risco de contaminação cruzada (traços)"
- 🟡 Badge "Pendente de avaliação" no topo — este é o único elemento coerente com o estado real do usuário, mas é enganoso: é o `profileEvaluationStatus` do **User** (IAM), não o `approvalStatus` do **Partner**.

---

## 2. Causa raiz

**Arquivo:** [`frontend/web-app/src/app/profile/page.tsx`](../frontend/web-app/src/app/profile/page.tsx)

A página busca dados de três origens e renderiza tudo incondicionalmente, sem nunca checar `role`:

| Linha | O que faz |
|---|---|
| `140-157` | `GET /iam/me` → carrega nome, nascimento, gênero, WhatsApp, `profileEvaluationStatus` |
| `160-172` | `GET /consumer/me` → carrega `ConsumerStatus` (auto-criado no backend para **qualquer** usuário autenticado, inclusive `PARCEIRO`) |
| `175-191` | `foodProfileApi.getByUserId` → carrega restrições alimentares |
| `194-215` | `handleToggleConsumerStatus` → botão "Desativar Perfil" chama `POST /consumer/me/status`, ou seja, **desativa o `Consumer`, não o `Partner` nem o `User`** |
| `480-543` | Seção JSX "Restrições alimentares" — renderizada sempre, sem guard de `role` |

Não existe nenhum `if (role === 'PARCEIRO')` neste arquivo.

### O mais importante: a correção já existe em outro lugar do código

Em [`frontend/web-app/src/app/dashboard/page.tsx:84-89`](../frontend/web-app/src/app/dashboard/page.tsx#L84), esse exato problema **já foi resolvido** (ver `CHANGELOG.md`, entrada `FEAT-040`, 2026-07-31: *"isenção de perfil consumidor no Dashboard para perfis ADMIN e PARCEIRO"*):

```tsx
const role = u?.role;
// Contas corporativas e operacionais (ADMIN e PARCEIRO) não exigem perfil alimentar de consumidor
if (role === 'ADMIN' || role === 'PARCEIRO') {
  setIsProfileIncomplete(false);
  return;
}
```

Ou seja: **o time já identificou e resolveu esse problema no Dashboard, mas o mesmo guard nunca foi replicado para `/profile`.** É um gap de paridade entre duas telas, não uma decisão de arquitetura em aberto.

---

## 3. Por que isso viola o domínio (não é só estética)

Segundo `PRDs/Análise de Partner no CeliLac.md`:

- **§5.3** — "Não devem ficar dentro do agregado Partner: regras de compatibilidade alimentar, regras de ingredientes, regras de alergênicos (...)".
- **§15.4** — "A interface deve evitar misturar cadastro comercial do Partner com informações alimentares específicas dos produtos."
- **§8.2** (Status Operacional do Partner) vs. o que a tela oferece: o botão "Desativar Perfil" atual **não corresponde a nenhum dos dois status reais do Partner** (`approvalStatus` e status operacional `ativo/inativo/temporariamente fechado`). Ele mexe num terceiro conceito (`ConsumerStatus`) que não tem relação alguma com o Partner.

Também contraria `docs/DOMAIN_MODEL.md` §10, que define `Consumer` como agregado próprio vinculado a `userId` — o problema é que o *backend* cria esse agregado para todo `userId` autenticado (`GET /consumer/me` com "auto-criação graciosa", ver `docs/features/consumer.md`), e o *frontend* nunca filtra a exibição por papel.

---

## 4. Correção recomendada

### 4.1 Fix mínimo (replicar o padrão já validado do Dashboard)

Em `profile/page.tsx`, dentro do `.then((user) => {...})` do `GET /iam/me` (linha ~140), capturar `role` em estado e usar para condicionar a renderização das seções:

- Ocultar o card "Status do Consumidor" (linhas 339-393) quando `role === 'PARCEIRO'` ou `'ADMIN'`.
- Ocultar a seção "Restrições alimentares" e o checkbox de contaminação cruzada (linhas 480-543, 546-560) quando `role === 'PARCEIRO'` ou `'ADMIN'`.
- Manter apenas "Dados pessoais" (nome, nascimento, gênero, WhatsApp, foto) — esses são dados de `User`/IAM, legítimos para qualquer papel.

### 4.2 Corrigir a semântica do botão (independente do fix acima)

Renomear "Desativar Perfil" para deixar claro que ele afeta o `ConsumerStatus`, não a conta nem o Partner — por exemplo **"Desativar participação como consumidor"**. Isso evita ambiguidade mesmo para o usuário `CELIACO` puro, que hoje também pode interpretar erroneamente que está desativando a própria conta.

### 4.3 Fix estrutural (opcional, para decisão do time — não bloqueia o item 4.1)

Para um `PARCEIRO` que **não** tem também papel de consumidor, avaliar se o link "Perfil" no Header deveria:
- (a) continuar levando a `/profile`, mas mostrando só os dados de `User` + um atalho para "Meu Partner" (`/partner`); ou
- (b) redirecionar diretamente para `/partner` quando `role === 'PARCEIRO'` e não houver necessidade de tela de dados pessoais separada.

Isso é uma decisão de produto, não uma correção de bug — recomendo tratar em item separado após o 4.1 e 4.2 estarem no ar.

---

## 5. Achado colateral — não faz parte deste bug, mas deve virar um item futuro

`docs/DOMAIN_MODEL.md` §3 descreve `PartnerStatus` como enum de 3 valores (`ACTIVE | SUSPENDED | PENDING_APPROVAL`). O código implementado em `frontend/web-app/src/app/partner/page.tsx` já usa o modelo de 5 estados descrito em `PRDs/Análise de Partner no CeliLac.md` §8.1 (`DRAFT / PENDING_REVIEW / APPROVED / REJECTED / SUSPENDED`). `DOMAIN_MODEL.md` está desatualizado em relação à implementação real e deveria ser corrigido para não virar fonte de confusão para o time (ou para agentes de IA que consultam esse arquivo).

---

## 6. Critérios de aceite

- [ ] Usuário com `role === 'PARCEIRO'` acessa `/profile` e **não vê** card de Status do Consumidor nem seção de Restrições Alimentares.
- [ ] Usuário com `role === 'ADMIN'` tem o mesmo comportamento (paridade com o Dashboard).
- [ ] Usuário com `role === 'CELIACO'` continua vendo a tela exatamente como hoje (nenhuma regressão).
- [ ] Botão de ativar/desativar Consumer renomeado para deixar explícito que afeta a participação como consumidor.
- [ ] O badge "Pendente de avaliação" no topo de `/profile` não é confundido com o `approvalStatus` do Partner — se necessário, avaliar se deve continuar aparecendo para `PARCEIRO` sem contexto de Consumer.

## 7. Arquivos envolvidos

- `frontend/web-app/src/app/profile/page.tsx` (fix principal)
- `frontend/web-app/src/app/dashboard/page.tsx` (padrão de referência, linhas 84-89)
- `docs/DOMAIN_MODEL.md` (achado colateral, §3)
