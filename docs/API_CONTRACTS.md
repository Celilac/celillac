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
   - [POST /iam/logout](#post-iamlogout)
3. [Perfil Alimentar](#3-perfil-alimentar)
   - [POST /food-profile](#post-food-profile)
   - [GET /food-profile/:userId](#get-food-profileuserid)
4. [Compatibilidade Alimentar](#4-compatibilidade-alimentar)
   - [POST /compatibility/check](#post-compatibilitycheck)
5. [Catálogo de Produtos](#5-catálogo-de-produtos)
   - [POST /catalog/products](#post-catalogproducts)
   - [GET /catalog/products](#get-catalogproducts)
6. [Avaliações (Social Proof)](#6-avaliacoes)
   - [POST /reviews](#post-reviews)
   - [GET /reviews/product/:productId](#get-reviewsproductproductid)
7. [Gestão de Parceiros (Partners)](#7-gestão-de-parceiros-partners)
   - [POST /partners](#post-partners)
   - [GET /partners/me/all](#get-partnersmeall)
   - [PUT /partners/:id](#put-partnersid)
   - [POST /partners/:id/submit](#post-partnersidsubmit)
   - [PATCH /partners/:id/operational-status](#patch-partnersidoperational-status)
   - [GET /partners](#get-partners)
   - [GET /admin/partners](#get-adminpartners)
8. [Health Check](#8-health-check)
9. [Enums de Domínio](#9-enums-de-domínio)
10. [Regras para Agentes de IA](#10-regras-para-agentes-de-ia)
11. [Consumidor (Consumer)](#11-consumidor-consumer)
   - [GET /consumer/me](#get-consumerme)
   - [PUT /consumer/preferences](#put-consumerpreferences)
   - [POST /consumer/restrictions](#post-consumerrestrictions)
   - [DELETE /consumer/restrictions/:allergen](#delete-consumerrestrictionsallergen)
12. [Moderação e Denúncias (Reports)](#12-moderação-e-denúncias-reports)
   - [POST /admin/reports](#post-adminreports)
   - [GET /admin/reports](#get-adminreports)
   - [PATCH /admin/reports/:id/status](#patch-adminreportsidstatus)

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

### `POST /iam/logout`

Revoga o token JWT do usuário autenticado inserindo-o na blacklist. 🔒 **Autenticação obrigatória — Bearer Token.**

**Request Body:**
*(Nenhum)*

**Response `200 OK`:**
*(Corpo vazio)*

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `401` | `"Token de autenticação não fornecido."` | Header Authorization ausente |
| `401` | `"Token de autenticação malformado."` | Esquema incorreto ou formato do token inválido |
| `401` | `"Token inválido ou expirado."` | Assinatura JWT falhou ou tempo expirou |
| `401` | `"Token revogado."` | O token enviado já consta na blacklist de tokens revogados |

**Exemplo (curl):**
```bash
curl -X POST http://localhost:3000/iam/logout \
  -H "Authorization: Bearer <seu-jwt-token>"
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

### `POST /compatibility/check`

**Regra Fundamental (`FRONTEND_STRATEGY.md`):**
> O frontend/mobile NUNCA calcula compatibilidade localmente. SEMPRE consulta este endpoint.

**Request Body (planejado):**
```json
{
  "userId":    "uuid-do-usuario",
  "productId": "uuid-do-produto"
}
```

**Response `200 OK`:**
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
| `UNEVALUATED` | ⚪ | Perfil alimentar incompleto / sem restrições ativas | **Cinza/Neutro — orienta configuração de perfil (RN-CONSUMER-07)** |

> ⚠️ `BLOCKED` deve ter **destaque visual obrigatório** (vermelho + ícone de perigo) conforme `FRONTEND_STRATEGY.md`: *"Alertas alimentares devem ter destaque visual (vermelho/ícones de perigo)."*

---

## 5. Catálogo de Produtos

O Catálogo centraliza a base de dados de itens alimentícios. Produtos cadastrados aqui servem de insumo para o Motor de Alérgenos.

### `POST /catalog/products`

Cadastra um novo produto no catálogo.

**Request Body:**
```json
{
  "name": "Biscoito de Arroz",
  "brand": "CeliFood",
  "ingredients": "Arroz integral, sal marinho.",
  "hasGluten": false,
  "crossContamination": "Pode conter traços de soja."
}
```

| Campo | Tipo | Obrigatório | Validação |
|:------|:-----|:-----------:|:----------|
| `name` | `string` | ✅ | Nome do produto |
| `brand` | `string` | ❌ | Marca do produto |
| `ingredients` | `string` | ❌ | Lista de ingredientes. Se vazio, status vira `PENDENTE_DE_ANALISE` |
| `hasGluten` | `boolean` | ✅ | Declaração do fabricante se contém glúten |
| `crossContamination` | `string` | ✅ | Traços declarados. Pode ser vazio. |

**Response `201 Created`:**
```json
{
  "id": "uuid-do-produto",
  "name": "Biscoito de Arroz",
  "brand": "CeliFood",
  "ingredients": "Arroz integral, sal marinho.",
  "hasGluten": false,
  "crossContamination": "Pode conter traços de soja.",
  "analysisStatus": "ANALISADO"
}
```

---

### `GET /catalog/products`

Busca produtos pelo nome ou marca, com suporte a paginação.

**Query Parameters:**
| Parâmetro | Tipo | Padrão | Descrição |
|:----------|:-----|:-------|:----------|
| `q` | `string` | `""` | Termo de busca (`ILIKE` no nome ou marca) |
| `page` | `integer`| `1` | Página atual |
| `limit` | `integer`| `20` | Itens por página (máx 100) |

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "uuid-do-produto",
      "name": "Biscoito de Arroz",
      "brand": "CeliFood",
      "ingredients": "Arroz integral, sal marinho.",
      "hasGluten": false,
      "crossContamination": "Pode conter traços de soja.",
      "analysisStatus": "ANALISADO"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## 6. Avaliações (Social Proof)

O módulo de avaliações permite que usuários deem uma nota (1-5) para a acurácia do rótulo do produto, validando de forma comunitária a segurança do mesmo.

### `POST /reviews`

Cria ou atualiza a avaliação de um usuário para um produto (Upsert - limite de 1 por usuário). 🔒 *(autenticação necessária para produção)*

**Request Body:**
```json
{
  "userId": "uuid-do-usuario",
  "productId": "uuid-do-produto",
  "rating": 5,
  "comment": "Rótulo parece seguro e completo."
}
```

| Campo | Tipo | Obrigatório | Validação |
|:------|:-----|:-----------:|:----------|
| `userId` | `string (UUID)` | ✅ | ID do usuário avaliador |
| `productId` | `string (UUID)`| ✅ | ID do produto avaliado |
| `rating` | `integer`       | ✅ | Entre 1 e 5 |
| `comment` | `string`       | ❌ | Comentário opcional |

**Response `201 Created`:**
```json
{
  "id": "uuid-da-review",
  "userId": "uuid-do-usuario",
  "productId": "uuid-do-produto",
  "rating": 5,
  "comment": "Rótulo parece seguro e completo.",
  "createdAt": "2026-07-04T22:00:00Z"
}
```

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"userId, productId e rating (1-5) são obrigatórios."` | Input inválido |
| `404` | `"Produto não encontrado no catálogo."` | O produto não existe |

---

### `GET /reviews/product/:productId`

Recupera todas as avaliações de um produto específico e sua média.

**Path Parameter:**
| Parâmetro | Tipo | Descrição |
|:----------|:-----|:----------|
| `productId`| `string (UUID)` | ID do produto |

**Response `200 OK`:**
```json
{
  "productId": "uuid-do-produto",
  "totalReviews": 2,
  "averageRating": 4.5,
  "reviews": [
    {
      "id": "uuid-da-review",
      "userId": "uuid-do-usuario",
      "rating": 5,
      "comment": "Seguro",
      "createdAt": "2026-07-04T22:00:00Z"
    }
  ]
}
```

---

## 7. Gestão de Parceiros (Partners)

### `POST /partners` 🔒
Cadastra um novo perfil comercial de parceiro. Apenas para usuários com papel `PARCEIRO`.

**Request Body:**
```json
{
  "name": "Cantina Vegana Sem Glúten",
  "cnpj": "12345678000195",
  "description": "Pratos saudáveis livres de contaminação cruzada.",
  "address": "Av. Paulista, 1000",
  "phone": "11999998888",
  "type": "RESTAURANT",
  "city": "São Paulo",
  "state": "SP",
  "deliveryRegion": "Grande SP"
}
```

**Response `201 Created`:**
```json
{
  "id": "uuid-do-parceiro",
  "userId": "uuid-do-dono",
  "name": "Cantina Vegana Sem Glúten",
  "cnpj": "12345678000195",
  "description": "Pratos saudáveis livres de contaminação cruzada.",
  "address": "Av. Paulista, 1000",
  "phone": "11999998888",
  "type": "RESTAURANT",
  "approvalStatus": "DRAFT",
  "operationalStatus": "INACTIVE",
  "city": "São Paulo",
  "state": "SP",
  "deliveryRegion": "Grande SP"
}
```

---

### `GET /partners/me/all` 🔒
Lista todos os parceiros comerciais vinculados ao usuário responsável logado.

**Response `200 OK`:**
```json
[
  {
    "id": "uuid-do-parceiro",
    "userId": "uuid-do-dono",
    "name": "Cantina Vegana Sem Glúten",
    "approvalStatus": "DRAFT",
    "operationalStatus": "INACTIVE"
  }
]
```

---

### `PUT /partners/:id` 🔒
Atualiza os dados cadastrais do parceiro. Alterações críticas regridem o status de aprovação para `PENDING_REVIEW` automaticamente.

**Request Body:**
```json
{
  "name": "Novo Nome Cantina",
  "address": "Novo Endereço, 123",
  "phone": "11988887777"
}
```

**Response `200 OK`:**
```json
{ "success": true }
```

---

### `POST /partners/:id/submit` 🔒
Submete o parceiro em rascunho (`DRAFT`) ou rejeitado (`REJECTED`) para análise da administração (`PENDING_REVIEW`).

**Response `200 OK`:**
```json
{ "success": true }
```

---

### `PATCH /partners/:id/operational-status` 🔒
Altera a disponibilidade operacional (`ACTIVE`, `INACTIVE`, `TEMPORARILY_CLOSED`).

**Request Body:**
```json
{
  "status": "TEMPORARILY_CLOSED"
}
```

**Response `200 OK`:**
```json
{ "success": true }
```

---

### `GET /partners`
Lista pública de parceiros aprovados (`APPROVED`) e operacionais (`ACTIVE` ou `TEMPORARILY_CLOSED`).

**Response `200 OK`:**
```json
[
  {
    "id": "uuid-do-parceiro",
    "name": "Cantina Vegana Sem Glúten",
    "description": "Pratos saudáveis livres de contaminação cruzada.",
    "type": "RESTAURANT",
    "operationalStatus": "ACTIVE",
    "city": "São Paulo",
    "state": "SP"
  }
]
```

---

### `GET /admin/partners` 🔒
Listagem para moderação administrativa de todos os parceiros comerciais cadastrados. Restrito a usuários `ADMIN`.

**Response `200 OK`:**
```json
[
  {
    "id": "uuid-do-parceiro",
    "name": "Cantina Vegana Sem Glúten",
    "approvalStatus": "PENDING_REVIEW",
    "operationalStatus": "INACTIVE"
  }
]
```

---

### `POST /partners/:id/approve` 🔒
Aprova o parceiro. Apenas para `ADMIN`.

**Response `200 OK`:**
```json
{ "success": true }
```

---

### `POST /partners/:id/reject` 🔒
Rejeita o parceiro informando o motivo. Apenas para `ADMIN`.

**Request Body:**
```json
{
  "reason": "Dados cadastrais inválidos ou CNPJ inativo."
}
```

**Response `200 OK`:**
```json
{ "success": true }
```

---

### `POST /partners/:id/suspend` 🔒
Suspende a operação do parceiro por violação ou denúncia grave. Apenas para `ADMIN`.

**Request Body:**
```json
{
  "reason": "Contaminação cruzada detectada na lanchonete."
}
```

**Response `200 OK`:**
```json
{ "success": true }
```

---

## 8. Health Check

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

## 9. Enums de Domínio

### `PartnerApprovalStatus`
*   `DRAFT` — Cadastro incompleto ou não enviado.
*   `PENDING_REVIEW` — Sob análise administrativa.
*   `APPROVED` — Aprovado para operar.
*   `REJECTED` — Reprovado (exige motivo).
*   `SUSPENDED` — Bloqueado por irregularidade (exige motivo).

### `PartnerOperationalStatus`
*   `ACTIVE` — Disponível para busca e atendimento.
*   `INACTIVE` — Fora de operação.
*   `TEMPORARILY_CLOSED` — Temporariamente fora de atendimento (exibe aviso).

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

### `RiskLevel`

Valores possíveis de nível de risco de compatibilidade:

| Valor | Português | Significado no Motor |
|:------|:----------|:---------------------|
| `SAFE` | Seguro | Nenhum alérgeno do perfil foi encontrado |
| `WARNING` | Atenção | Conflito de severidade LOW/MEDIUM ou traços |
| `DANGER` | Perigo | Conflito de severidade HIGH em ingredientes ou traços sem tolerância |
| `BLOCKED` | Bloqueado | Conflito FATAL ou produto sem lista de ingredientes declarados |
| `UNEVALUATED` | Não Avaliado / Perfil Incompleto | Perfil sem restrições ativas — não avaliado para evitar falsa segurança (RN-CONSUMER-07) |

### `UserRole`

| Valor | Descrição |
|:------|:----------|
| `CELIACO` | Usuário final com restrição alimentar |
| `PARCEIRO` | Restaurante ou loja parceira |
| `ADMIN` | Administrador da plataforma |

---

## 10. Regras para Agentes de IA

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

---

## 11. Consumidor (Consumer)

### `GET /consumer/me` 🔒

Retorna os dados consolidados do Consumidor logado, seu perfil alimentar associado e se há alertas de perfil incompleto. **Caso o consumidor ainda não exista, ele é auto-criado de forma transparente.**

**Headers:**
```
Authorization: Bearer <token>
```

**Response Body (200 OK):**
```json
{
  "consumer": {
    "id": "consumer-uuid-123",
    "userId": "user-uuid-456",
    "generalPreferences": {
      "theme": "dark"
    },
    "profileEvaluationStatus": "PENDING_EVALUATION",
    "hasIncompleteProfileWarning": false
  },
  "foodProfile": {
    "id": "profile-uuid-789",
    "userId": "user-uuid-456",
    "restrictions": [
      {
        "allergen": "GLUTEN",
        "severity": "FATAL",
        "type": "ALLERGY",
        "notes": "Celíaco grave"
      }
    ],
    "acceptsCrossContamination": false
  },
  "hasIncompleteProfileWarning": false
}
```

---

### `PUT /consumer/preferences` 🔒

Atualiza as preferências gerais de interface do consumidor.

**Request Body:**
```json
{
  "generalPreferences": {
    "theme": "light",
    "notificationsEnabled": true
  }
}
```

**Response Body (200 OK):**
```json
{
  "id": "consumer-uuid-123",
  "userId": "user-uuid-456",
  "generalPreferences": {
    "theme": "light",
    "notificationsEnabled": true
  }
}
```

---

### `PATCH /consumer/status` 🔒

Alterna o status de participação do perfil de consumidor entre `ATIVO` e `INATIVO` registrando rastreabilidade de auditoria.

**Request Body:**
```json
{
  "action": "DEACTIVATE",
  "reason": "Pausa temporária solicitada pelo usuário"
}
```

**Response Body (200 OK):**
```json
{
  "id": "consumer-uuid-123",
  "userId": "user-uuid-456",
  "status": "INATIVO",
  "statusChangedAt": "2026-08-01T17:50:00.000Z",
  "statusChangedBy": "user-uuid-456",
  "statusChangeReason": "Pausa temporária solicitada pelo usuário"
}
```

---

### `POST /consumer/restrictions` 🔒

Adiciona uma nova restrição alimentar diretamente ao perfil do consumidor logado.

**Request Body:**
```json
{
  "allergen": "LACTOSE",
  "severity": "MEDIUM",
  "type": "INTOLERANCE",
  "notes": "Intolerância leve"
}
```

**Response Body (200 OK / 201 Created):**
```json
{
  "success": true,
  "message": "Restrição adicionada com sucesso."
}
```

---

### `DELETE /consumer/restrictions/:allergen` 🔒

Remove uma restrição alimentar existente por tipo de alérgeno.

**Response Body (200 OK):**
```json
{
  "success": true,
  "message": "Restrição removida com sucesso."
}
```

---

## 12. Moderação e Denúncias (Reports)

### `POST /admin/reports` 🔒

Cria uma nova denúncia contra um produto ou parceiro comercial. **Autenticação obrigatória — Bearer Token.**

> 💡 **Nota:** Para denunciar um produto, envie `productId`. Para denunciar um parceiro comercial, envie `partnerId`. Ao menos um dos dois deve ser fornecido.

**Request Body:**
```json
{
  "productId": "prod-uuid-123",
  "partnerId": "partner-uuid-456",
  "reason": "MISSING_ALLERGEN",
  "details": "Omitiu traços de glúten na rotulagem",
  "isFoodSafetyRisk": true
}
```

| Campo | Tipo | Obrigatório | Validação / Descrição |
|:------|:-----|:-----------:|:----------------------|
| `productId` | `string` | Opcional* | ID do produto denunciado (Obrigatório se `partnerId` não for informado). |
| `partnerId` | `string` | Opcional* | ID do parceiro comercial denunciado (Obrigatório se `productId` não for informado). |
| `reason` | `enum` | ✅ | `INCORRECT_INGREDIENTS` \| `MISSING_ALLERGEN` \| `WRONG_CROSS_CONTAMINATION` \| `OTHER` |
| `details` | `string` | Opcional | Descrição detalhada da denúncia. |
| `isFoodSafetyRisk` | `boolean` | Opcional | Calculado automaticamente para motivos graves (`MISSING_ALLERGEN`, `WRONG_CROSS_CONTAMINATION`) se omitido. |

**Response Body (201 Created):**
```json
{
  "id": "report-uuid-789",
  "reporterId": "user-uuid-123",
  "productId": "prod-uuid-123",
  "partnerId": null,
  "reason": "MISSING_ALLERGEN",
  "isFoodSafetyRisk": true,
  "status": "PENDING",
  "details": "Omitiu traços de glúten na rotulagem",
  "createdAt": "2026-08-03T19:00:00.000Z",
  "updatedAt": "2026-08-03T19:00:00.000Z"
}
```

---

### `GET /admin/reports` 🔒 *(Restrito: ADMIN)*

Lista as denúncias registradas na plataforma. Prioriza automaticamente denúncias de risco de segurança alimentar (`is_food_safety_risk DESC`).

**Query Parameters:**
- `status` (`string`, opcional): `PENDING` | `IN_REVIEW` | `RESOLVED` | `DISMISSED`
- `isFoodSafetyRisk` (`boolean`, opcional): `true` | `false`

**Response Body (200 OK):**
```json
[
  {
    "id": "report-uuid-789",
    "reporterId": "user-uuid-123",
    "partnerId": "partner-uuid-456",
    "reason": "WRONG_CROSS_CONTAMINATION",
    "isFoodSafetyRisk": true,
    "status": "PENDING",
    "details": "Contaminação cruzada sistemática no restaurante",
    "createdAt": "2026-08-03T19:00:00.000Z",
    "updatedAt": "2026-08-03T19:00:00.000Z"
  }
]
```

---

### `PATCH /admin/reports/:id/status` 🔒 *(Restrito: ADMIN)*

Atualiza o status de uma denúncia.

**Request Body:**
```json
{
  "newStatus": "RESOLVED"
}
```

**Response Body (200 OK):**
```json
{
  "id": "report-uuid-789",
  "reporterId": "user-uuid-123",
  "partnerId": "partner-uuid-456",
  "reason": "WRONG_CROSS_CONTAMINATION",
  "isFoodSafetyRisk": true,
  "status": "RESOLVED",
  "details": "Contaminação cruzada sistemática no restaurante",
  "createdAt": "2026-08-03T19:00:00.000Z",
  "updatedAt": "2026-08-03T19:05:00.000Z"
}
```

---

### `PATCH /admin/users/:id/demote` 🔒 *(Restrito: ADMIN)*

Remove o privilégio de Administrador de um usuário, retornando-o para a role `CELIACO`. O `profileEvaluationStatus` é resetado para `PENDING_EVALUATION`.

**Restrições:**
- Apenas ADMINs ativos podem executar esta ação.
- O administrador não pode se auto-rebaixar.
- Só pode ser aplicado a usuários que **já possuem role ADMIN**.

**Path Parameter:**
| Parâmetro | Tipo | Descrição |
|:----------|:-----|:----------|
| `id` | `string (UUID)` | ID do usuário ADMIN a ser rebaixado |

**Response `200 OK`:**
*(Corpo vazio)*

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"Somente administradores ativos podem rebaixar usuários."` | Solicitante não é ADMIN ativo |
| `400` | `"Um administrador não pode rebaixar a si mesmo."` | Auto-rebaixamento |
| `400` | `"Usuário não encontrado."` | ID não existe |
| `400` | `"Somente usuários com role ADMIN podem ser rebaixados."` | Alvo não é ADMIN |
| `401` | `"Usuário não autenticado."` | Token ausente |

---

### `DELETE /admin/users/:id` 🔒 *(Restrito: ADMIN)*

Remove permanentemente a conta de um usuário do sistema. Todos os dados vinculados (perfil alimentar, favoritos, avaliações, denúncias) são removidos em cascata pelo banco de dados. O e-mail ficará disponível para novo cadastro.

**Restrições:**
- Apenas ADMINs ativos podem executar esta ação.
- O administrador não pode excluir a si mesmo.

**Path Parameter:**
| Parâmetro | Tipo | Descrição |
|:----------|:-----|:----------|
| `id` | `string (UUID)` | ID do usuário a ser excluído |

**Response `200 OK`:**
*(Corpo vazio)*

**Erros possíveis:**
| Status | `error` | Causa |
|:-------|:--------|:------|
| `400` | `"Somente administradores ativos podem excluir contas de usuários."` | Solicitante não é ADMIN ativo |
| `400` | `"Um administrador não pode excluir a si mesmo."` | Auto-exclusão |
| `400` | `"Usuário não encontrado."` | ID não existe |
| `401` | `"Usuário não autenticado."` | Token ausente |

