# API Contracts — CeLiLac

> **Versão:** v1.0  
> **Base URL (dev):** `http://localhost:3000`  
> **Última atualização:** 2026-07-04  
> **Fonte de verdade:** Controllers e Use Cases do backend (Clean Architecture).
> **OpenAPI/Swagger:** [docs/openapi.yaml](openapi.yaml) (Especificação formal para geração de clientes)

---

## 📋 Índice

1. [Convenções Gerais](#1-convenções-gerais)
2. [IAM — Autenticação](#2-iam--autenticação)
   - [POST /iam/register](#post-iamregister)
   - [POST /iam/login](#post-iamlogin)
3. [Perfil Alimentar](#3-perfil-alimentar)
   - [POST /food-profile](#post-food-profile)
   - [GET /food-profile/:userId](#get-food-profileuserid)
4. [Compatibilidade Alimentar](#4-compatibilidade-alimentar)
   - [POST /compatibility/check](#post-compatibilitycheck-futura)
5. [Health Check](#5-health-check)
6. [Enums de Domínio](#6-enums-de-domínio)
7. [Regras para Agentes de IA](#7-regras-para-agentes-de-ia)

---

## 1. Convenções Gerais

### Autenticação
Endpoints marcados com 🔒 requerem JWT no header:
```
Authorization: Bearer <token>
```
O JWT é emitido por `POST /iam/login` e tem validade de **7 dias** (configurável via `JWT_EXPIRES_IN`).

**Payload do JWT:**
```json
{
  "sub":  "uuid-do-usuario",
  "role": "CELIACO | PARCEIRO | ADMIN",
  "iat":  1234567890,
  "exp":  1234567890
}
```

### Formato de Resposta

**Sucesso:**
```json
{ "campo": "valor" }
```

**Erro:**
```json
{ "error": "Mensagem descritiva do erro." }
```

### Códigos HTTP Usados

| Código | Significado | Quando |
|:-------|:------------|:-------|
| `200` | OK | GET com sucesso |
| `201` | Created | POST que cria recurso |
| `400` | Bad Request | Input inválido ou regra de domínio violada |
| `401` | Unauthorized | Token ausente, expirado ou credenciais inválidas |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Recurso já existe (e-mail duplicado, perfil duplicado) |
| `500` | Server Error | Erro interno não tratado |

### Headers Obrigatórios
```
Content-Type: application/json
```

---

## 2. IAM — Autenticação

### `POST /iam/register`

Registra um novo usuário. **Público — sem autenticação.**

**Request Body:**
```json
{
  "email":    "celiaco@exemplo.com",
  "password": "MinhaSenh@123",
  "role":     "CELIACO"
}
```

| Campo | Tipo | Obrigatório | Validação |
|:------|:-----|:-----------:|:----------|
| `email` | `string` | ✅ | Formato de e-mail válido (RFC 5322). Normalizado para minúsculas. |
| `password` | `string` | ✅ | Mínimo 8 caracteres. Armazenado com `bcrypt` (10 rounds). |
| `role` | `enum` | ✅ | `CELIACO` \| `PARCEIRO` \| `ADMIN` |

**Response `201 Created`:**
```json
{
  "id":    "uuid-v4",
  "email": "celiaco@exemplo.com",
  "role":  "CELIACO"
}
```

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"Os campos email, password e role são obrigatórios."` | Campo ausente |
| `400` | `"Role inválida. Use: CELIACO, PARCEIRO, ADMIN."` | Role desconhecida |
| `400` | `"E-mail inválido."` | Formato de e-mail rejeitado pelo domínio |
| `409` | `"Este e-mail já está em uso."` | E-mail duplicado no banco |

**Exemplo (curl):**
```bash
curl -X POST http://localhost:3000/iam/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":    "celiaco@celilac.dev",
    "password": "Senha@1234",
    "role":     "CELIACO"
  }'
```

---

### `POST /iam/login`

Autentica um usuário existente e retorna um JWT. **Público — sem autenticação.**

**Request Body:**
```json
{
  "email":    "celiaco@exemplo.com",
  "password": "MinhaSenh@123"
}
```

| Campo | Tipo | Obrigatório |
|:------|:-----|:-----------:|
| `email` | `string` | ✅ |
| `password` | `string` | ✅ |

**Response `200 OK`:**
```json
{
  "token":     "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

> 💡 **Para o Mobile/Web:** Armazene o `token` em memória (nunca em `localStorage` ou SharedPreferences sem criptografia). O campo `sub` no payload JWT contém o `userId` necessário para `GET /food-profile/:userId`.

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"Os campos email e password são obrigatórios."` | Campo ausente |
| `401` | `"Credenciais inválidas."` | E-mail ou senha incorretos (mensagem genérica intencional) |

**Exemplo (curl):**
```bash
curl -X POST http://localhost:3000/iam/login \
  -H "Content-Type: application/json" \
  -d '{"email": "celiaco@celilac.dev", "password": "Senha@1234"}'
# → { "token": "eyJ...", "expiresIn": "7d" }
```

---

## 3. Perfil Alimentar

O Perfil Alimentar é o **elo central** da plataforma: conecta o Usuário (IAM) ao Motor de Alérgenos. Sem um perfil ativo, nenhuma verificação de compatibilidade é possível.

### `POST /food-profile`

Cria o perfil alimentar de um usuário com suas restrições. 🔒 *(autenticação necessária para produção — implementar middleware de JWT na próxima fase)*

**Request Body:**
```json
{
  "userId": "uuid-do-usuario",
  "restrictions": [
    {
      "allergen": "GLUTEN",
      "severity": "FATAL"
    },
    {
      "allergen": "LACTOSE",
      "severity": "MEDIUM"
    }
  ]
}
```

| Campo | Tipo | Obrigatório | Validação |
|:------|:-----|:-----------:|:----------|
| `userId` | `string (UUID)` | ✅ | Deve ser o `sub` do JWT do usuário autenticado |
| `restrictions` | `array` | ✅ | Mínimo 1 item. Sem alérgenos duplicados. |
| `restrictions[].allergen` | `enum` | ✅ | Ver [Enums — AllergenType](#allergentype) |
| `restrictions[].severity` | `enum` | ✅ | Ver [Enums — SeverityLevel](#severitylevel) |

**Response `201 Created`:**
```json
{
  "id":                          "uuid-do-perfil",
  "userId":                      "uuid-do-usuario",
  "isActive":                    true,
  "requiresHistoryRevalidation": false,
  "restrictions": [
    {
      "id":       "uuid-da-restricao",
      "allergen": "GLUTEN",
      "severity": "FATAL"
    },
    {
      "id":       "uuid-da-restricao-2",
      "allergen": "LACTOSE",
      "severity": "MEDIUM"
    }
  ]
}
```

| Campo de Resposta | Tipo | Descrição |
|:-----------------|:-----|:----------|
| `id` | UUID | ID único do perfil |
| `userId` | UUID | Referência ao usuário |
| `isActive` | boolean | `true` se houver ≥ 1 restrição |
| `requiresHistoryRevalidation` | boolean | `true` se alguma restrição é `FATAL` — sinaliza ao frontend que verificações passadas devem ser revalidadas |
| `restrictions` | array | Lista com `id`, `allergen` e `severity` de cada restrição |

> ⚠️ **`requiresHistoryRevalidation: true`** → O frontend/mobile DEVE exibir um aviso proeminente ao usuário, informando que verificações anteriores de produtos devem ser refeitas com o novo perfil.

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"O campo userId é obrigatório."` | `userId` ausente |
| `400` | `"O campo restrictions deve ser um array não vazio."` | Array vazio ou ausente |
| `400` | `"Alérgeno inválido: XYZ."` | Valor de `allergen` não reconhecido |
| `400` | `"Severidade inválida: XYZ."` | Valor de `severity` não reconhecido |
| `400` | `"Alérgeno duplicado: GLUTEN."` | Mesmo alérgeno aparece mais de uma vez |
| `409` | `"Este usuário já possui um perfil alimentar. Use a atualização."` | Tentativa de criar segundo perfil |

**Exemplo (curl):**
```bash
curl -X POST http://localhost:3000/food-profile \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "aed052fa-b410-440b-a1f4-2a73268bae49",
    "restrictions": [
      { "allergen": "GLUTEN",  "severity": "FATAL" },
      { "allergen": "LACTOSE", "severity": "LOW" }
    ]
  }'
```

---

### `GET /food-profile/:userId`

Recupera o perfil alimentar de um usuário pelo seu ID.

**Path Parameter:**

| Parâmetro | Tipo | Descrição |
|:----------|:-----|:----------|
| `userId` | `string (UUID)` | ID do usuário (campo `sub` do JWT) |

**Response `200 OK`:**
```json
{
  "id":                          "uuid-do-perfil",
  "userId":                      "uuid-do-usuario",
  "isActive":                    true,
  "requiresHistoryRevalidation": false,
  "restrictions": [
    {
      "id":       "uuid-da-restricao",
      "allergen": "GLUTEN",
      "severity": "FATAL"
    }
  ]
}
```

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"Perfil alimentar não encontrado para o usuário."` | `userId` não tem perfil cadastrado |

**Fluxo Mobile — Onboarding:**
```
1. POST /iam/register  → obtém { id, email, role }
2. POST /iam/login     → obtém { token }
3. POST /food-profile  → cria perfil com restrições
4. GET  /food-profile/:userId → exibe perfil salvo para confirmação
```

**Exemplo (curl):**
```bash
curl http://localhost:3000/food-profile/aed052fa-b410-440b-a1f4-2a73268bae49
```

---

## 4. Compatibilidade Alimentar

### `POST /compatibility/check` *(futura — FEAT-005)*

> ⚠️ **Este endpoint ainda não está implementado no backend.**  
> O `AllergenEngine` existe e está validado (53 testes). O endpoint será implementado na FEAT-005.

**Regra Fundamental (`FRONTEND_STRATEGY.md`):**
> O frontend/mobile NUNCA calcula compatibilidade localmente. SEMPRE consulta este endpoint.

**Request Body (planejado):**
```json
{
  "userId":    "uuid-do-usuario",
  "productId": "uuid-do-produto"
}
```

**Response `200 OK` (planejada):**
```json
{
  "isCompatible": false,
  "riskLevel":    "BLOCKED",
  "reasoning":    "Celíaco (FATAL) + traços de glúten detectados em cross_contamination.",
  "conflicts": [
    {
      "allergen": "GLUTEN",
      "severity": "FATAL",
      "reason":   "Detectado em cross_contamination: 'Pode conter traços de glúten de trigo.'"
    }
  ]
}
```

**Valores possíveis de `riskLevel`:**

| Valor | Ícone | Significado | Renderização obrigatória |
|:------|:-----:|:------------|:------------------------|
| `SAFE` | ✅ | Nenhum alérgeno do perfil detectado | Verde |
| `WARNING` | 🟡 | Alérgeno de baixa/média severidade presente | Amarelo |
| `DANGER` | ⚠️ | Alérgeno de alta severidade presente | Laranja |
| `BLOCKED` | ⛔ | FATAL detectado ou produto sem ingredientes | **Vermelho — destaque máximo** |

> ⚠️ `BLOCKED` deve ter **destaque visual obrigatório** (vermelho + ícone de perigo) conforme `FRONTEND_STRATEGY.md`: *"Alertas alimentares devem ter destaque visual (vermelho/ícones de perigo)."*

---

## 5. Health Check

### `GET /health`

Verifica se o servidor está respondendo. **Público — sem autenticação.**

**Response `200 OK`:**
```json
{
  "status":  "OK",
  "service": "CeLiLac Backend"
}
```

---

## 6. Enums de Domínio

### `AllergenType`

Valores aceitos nos campos `allergen`:

| Valor | Português | Termos detectados nos ingredientes |
|:------|:----------|:----------------------------------|
| `GLUTEN` | Glúten | trigo, glúten, centeio, cevada, aveia, semolina, espelta |
| `LACTOSE` | Lactose / Leite | leite, lactose, creme, manteiga, queijo, iogurte, whey, caseína, soro |
| `NUTS` | Castanhas / Amendoim | castanha, amêndoa, amendoim, noz, macadâmia, pistache, pecã |
| `SOY` | Soja | soja, lecitina de soja, proteína de soja |
| `EGGS` | Ovos | ovo, ovos, albumina, gema, clara |
| `SHELLFISH` | Frutos do Mar | camarão, caranguejo, lagosta, lula, polvo, mexilhão, ostra, frutos do mar |
| `FISH` | Peixes | peixe, atum, salmão, sardinha, bacalhau, tilápia, anchova |
| `SESAME` | Gergelim | gergelim, sésamo, tahine |
| `OTHER` | Outro | *(sem termos automáticos — registro manual)* |

### `SeverityLevel`

Valores aceitos nos campos `severity`:

| Valor | Ordem | Comportamento no Motor |
|:------|:-----:|:-----------------------|
| `LOW` | 1 | Alérgeno detectado → `WARNING` |
| `MEDIUM` | 2 | Alérgeno detectado → `WARNING` |
| `HIGH` | 3 | Alérgeno detectado → `DANGER` |
| `FATAL` | 4 | Alérgeno **ou traços** detectados → `BLOCKED` |

> ⚠️ `FATAL` é o nível para **Doença Celíaca diagnosticada**. Um produto com `cross_contamination` contendo qualquer menção a glúten resulta em `BLOCKED` — sem exceção. Esta é uma regra de segurança alimentar crítica validada nos casos de teste TC-02 e TC-04.

### `UserRole`

| Valor | Descrição |
|:------|:----------|
| `CELIACO` | Usuário final com restrição alimentar |
| `PARCEIRO` | Restaurante ou loja parceira |
| `ADMIN` | Administrador da plataforma |

---

## 7. Regras para Agentes de IA

> Esta seção é direcionada a agentes de IA que consumirem esta documentação ao implementar Frontend, Mobile ou novas integrações.

### ❌ NUNCA fazer

1. **Replicar a lógica do `AllergenEngine` no frontend ou mobile.** A compatibilidade é calculada EXCLUSIVAMENTE no backend via `POST /compatibility/check`.
2. **Armazenar o JWT em `localStorage` ou `SharedPreferences` sem criptografia.** Use armazenamento em memória (web) ou Keychain/Keystore (mobile).
3. **Exibir mensagens de erro de autenticação específicas** ("e-mail não encontrado", "senha incorreta"). O backend retorna "Credenciais inválidas." intencionalmente.
4. **Ignorar o campo `requiresHistoryRevalidation`.** Quando `true`, DEVE exibir aviso ao usuário.
5. **Alterar campos obrigatórios ou endpoints existentes sem aprovação humana** (`API_CONTRACTS.md` seção 5).

### ✅ SEMPRE fazer

1. **Usar `src/api/` (web) ou `lib/api/` (mobile)** como única camada de comunicação HTTP.
2. **Renderizar `riskLevel` com a cor correta:** SAFE=verde, WARNING=amarelo, DANGER=laranja, BLOCKED=vermelho+destaque.
3. **Passar o JWT no header `Authorization: Bearer <token>`** em todos os endpoints protegidos.
4. **Decodificar o `sub` do JWT** para obter o `userId` (não pedir ao usuário).
5. **Tratar o erro 409** em `POST /food-profile` como "perfil já existe" — redirecionar para tela de atualização.

### Fluxo Padrão de Integração (Web/Mobile)

```
Usuário abre o app
    │
    ├─► [Sem conta] POST /iam/register → POST /iam/login → JWT
    │
    └─► [Com conta] POST /iam/login → JWT
                         │
                         ▼
                  Decodificar JWT → userId = payload.sub
                         │
                         ▼
                  GET /food-profile/:userId
                    ├─► 200: Perfil existe → ir para Dashboard
                    └─► 400: Sem perfil → ir para tela de onboarding
                                              │
                                              ▼
                                    POST /food-profile
                                              │
                                              ▼
                                    Dashboard: POST /compatibility/check
                                    para cada produto verificado
```
