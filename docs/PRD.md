# PRD — Product Requirements Document
# CeLiLac: Plataforma de Segurança Alimentar para Celíacos

> **Versão:** 1.0
> **Última atualização:** 2026-07-17
> **Quem deve consultar:** Agentes de IA, Desenvolvedores, Product Owners
> **Decisões que controla:** Escopo das funcionalidades e priorização
> **Alterações que exigem validação humana:** Qualquer mudança em regras de negócio, requisitos de segurança alimentar ou fluxos de dado críticos.

---

## 1. Visão e Objetivo

**Missão:** O CeLiLac protege a saúde de celíacos e pessoas com restrições alimentares, fornecendo informação confiável sobre a segurança de produtos — incluindo **contaminação cruzada**, que não aparece nos ingredientes principais mas pode causar reações graves.

**Problema:** Celíacos não podem confiar apenas no rótulo "sem glúten". A contaminação cruzada durante fabricação ou manipulação representa risco real e invisível. Hoje, não existe plataforma acessível que consolide essa informação com validação da comunidade.

**Solução:** Uma plataforma (web + mobile) que:
1. Armazena o perfil alimentar do usuário (alérgenos + severidade).
2. Analisa produtos via motor de compatibilidade (`AllergenEngine`).
3. Emite um veredicto claro: `SAFE` / `WARNING` / `DANGER` / `BLOCKED`.
4. Constrói confiança via avaliações da comunidade e moderação de denúncias.

---

## 2. Personas

### 👤 Persona 1 — Ana, Consumidora Celíaca
- **Perfil:** 34 anos, celíaca diagnosticada há 5 anos, usa aplicativos de saúde no dia a dia.
- **Dor:** Já foi hospitalizada por contaminação cruzada de um produto com rótulo "sem glúten". Não confia apenas no fabricante.
- **Objetivo:** Escanear ou buscar produtos antes de comprar e receber um veredicto imediato e confiável.
- **Restrição:** `GLUTEN` com severidade `FATAL`.
- **Interface:** App mobile — usa durante compras no supermercado.

### 👤 Persona 2 — Carlos, Parceiro (Dono de Restaurante)
- **Perfil:** 45 anos, dono de restaurante que serve pratos sem glúten, quer aumentar a confiança dos clientes.
- **Dor:** Não tem como provar que seus pratos são seguros de forma verificável e transparente.
- **Objetivo:** Cadastrar produtos com lista completa de ingredientes e informações de cross-contamination.
- **Interface:** Web App — cadastro via painel de parceiro.

### 👤 Persona 3 — Lara, Administradora
- **Perfil:** 28 anos, responsável pela curadoria de dados na CeLiLac.
- **Dor:** Dados incorretos no catálogo geram risco alimentar real para usuários celíacos.
- **Objetivo:** Revisar e resolver denúncias de usuários sobre produtos com informações imprecisas.
- **Interface:** Web App — painel de moderação.

---

## 3. Jornadas de Usuário

### 🛒 Jornada 1 — Verificar Segurança de um Produto (Ana)
```
1. Ana abre o app mobile e está logada.
2. Na Home, usa o scanner de código de barras ou busca por nome.
3. O app busca o produto (GET /catalog/products?search=nome).
4. O app chama POST /compatibility/check com userId e productId.
5. O AllergenEngine retorna { riskLevel: "BLOCKED", reasoning: "..." }.
6. A tela exibe banner vermelho ⛔ BLOQUEADO com o motivo detalhado.
7. Ana não compra o produto.
```

### 📝 Jornada 2 — Configurar Perfil Alimentar (Ana — Onboarding)
```
1. Ana cria uma conta (POST /iam/register).
2. É direcionada para o Onboarding de Perfil.
3. Seleciona alérgenos e severidades (ex: GLUTEN/FATAL, LACTOSE/HIGH).
4. Envia (POST /food-profile).
5. O perfil orienta todas as análises de compatibilidade subsequentes.
```

### 📦 Jornada 3 — Cadastrar Produto (Carlos)
```
1. Carlos loga no web app como PARCEIRO.
2. Acessa a tela de cadastro de produto.
3. Preenche: nome, marca, ingredientes, has_gluten, cross_contamination.
4. Envia (POST /catalog/products).
5. Produto fica disponível para busca e verificação imediata.
```

### 🚨 Jornada 4 — Denunciar Dado Incorreto (Ana)
```
1. Ana encontra produto com informação incorreta (cross_contamination vazio).
2. Clica em "Denunciar" na tela do produto.
3. Seleciona o motivo (MISSING_ALLERGEN) e envia (POST /admin/reports).
4. Denúncia fica com status PENDING para revisão.
```

### ✅ Jornada 5 — Moderar Denúncia (Lara)
```
1. Lara acessa o painel de administração.
2. Filtra denúncias PENDING (GET /admin/reports?status=PENDING).
3. Analisa a denúncia e atualiza o status (PATCH /admin/reports/:id/status).
4. Corrige os dados do produto no catálogo.
```

---

## 4. Requisitos Funcionais

### RF-01 — IAM (Identidade e Acesso)
| ID | Requisito |
|:---|:----------|
| RF-01.1 | Permitir cadastro com e-mail e senha. |
| RF-01.2 | Autenticar usuários via JWT (validade 7 dias). |
| RF-01.3 | Suportar 3 roles: `CELIACO`, `PARCEIRO`, `ADMIN`. |
| RF-01.4 | Rotas privadas exigem JWT válido no header `Authorization: Bearer <token>`. |

### RF-02 — Perfil Alimentar
| ID | Requisito |
|:---|:----------|
| RF-02.1 | Usuário pode criar e atualizar seu perfil alimentar. |
| RF-02.2 | Perfil contém lista de restrições (alérgeno + severidade). |
| RF-02.3 | Perfil sem restrições = inativo → resultado `SAFE` para qualquer produto. |
| RF-02.4 | Mudanças em restrições `FATAL` devem exibir aviso de revalidação de histórico. |

### RF-03 — Compatibilidade Alimentar (Core Domain)
| ID | Requisito |
|:---|:----------|
| RF-03.1 | Calcular compatibilidade via `AllergenEngine` (domínio puro). |
| RF-03.2 | Retornar: `isCompatible`, `riskLevel`, `conflicts[]`, `reasoning`. |
| RF-03.3 | Produto sem ingredientes → `BLOCKED` (princípio da precaução). |
| RF-03.4 | Cálculo de compatibilidade **nunca** ocorre no frontend ou mobile. |

### RF-04 — Catálogo de Produtos
| ID | Requisito |
|:---|:----------|
| RF-04.1 | Parceiros e admins podem cadastrar produtos. |
| RF-04.2 | Qualquer usuário pode buscar produtos por nome ou marca. |
| RF-04.3 | Campo `cross_contamination` é obrigatório no cadastro. |
| RF-04.4 | Produto sem ingredientes é marcado como `PENDING_ANALYSIS`. |

### RF-05 — Avaliações e Confiança
| ID | Requisito |
|:---|:----------|
| RF-05.1 | Usuários autenticados podem avaliar produtos (rating 1–5 + comentário). |
| RF-05.2 | Cada usuário avalia um produto apenas uma vez (upsert). |
| RF-05.3 | Qualquer usuário pode consultar avaliações de um produto. |

### RF-06 — Administração e Moderação
| ID | Requisito |
|:---|:----------|
| RF-06.1 | Usuários autenticados podem criar denúncias sobre produtos. |
| RF-06.2 | Admins listam, filtram e atualizam status de denúncias. |
| RF-06.3 | Denúncia em estado final (`RESOLVED`/`DISMISSED`) não pode ser alterada. |

---

## 5. Requisitos Não-Funcionais

### RNF-01 — Segurança Alimentar ⚠️
- O `AllergenEngine` é a **única fonte de verdade** sobre compatibilidade de produtos.
- Qualquer alteração no motor exige aprovação humana e suíte de testes regressivos.
- Resultado `BLOCKED` nunca pode ser exibido como `SAFE` por nenhuma camada do sistema.

### RNF-02 — Segurança de Dados (LGPD)
- Restrições alimentares são dados sensíveis de saúde — tratamento reforçado obrigatório.
- Senhas armazenadas apenas como hash bcrypt — nunca em texto puro.
- JWT não pode vazar em logs ou respostas de erro.
- Dados de produção nunca aparecem no ambiente de desenvolvimento.

### RNF-03 — Performance
- `POST /compatibility/check` deve responder em < 500ms.
- Busca de produtos deve responder em < 1s com até 10.000 itens no catálogo.

### RNF-04 — Resiliência
- API retorna mensagens amigáveis — nunca stack traces para o usuário final.
- Em falha de banco, retornar HTTP 503, não 500.

### RNF-05 — Arquitetura
- Clean Architecture estrita: dependências apontam para o domínio.
- Nenhuma regra de negócio em controllers, frontend ou mobile.
- Toda lógica de compatibilidade alimentar no domínio (`AllergenEngine`).

