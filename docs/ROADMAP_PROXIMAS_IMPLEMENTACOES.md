# 📌 Roadmap de Próximas Implementações — CeLiLac

> **Data de Atualização:** 2026-10-22  
> **Status:** Planejamento e Backlog Técnico  
> **Contexto:** Próximos passos após a consolidação da Fase 4 (Transação/Pagamentos) e transição para o Modo de Produção da VPS (FEAT-115).

---

## 🎯 1. Prioridade Alta (Curto Prazo — Fechamento da Jornada Transacional)

### 1.1. 🔔 Notificações em Tempo Real Autenticadas (Pedidos & Cozinha)
- **Problema/Contexto:** O endpoint público de teste SSE foi removido por segurança (`BUGFIX-111`). Agora é indispensável um canal de comunicação bidirecional ou reativo para a operação ao vivo.
- **Implementação:**
  - **Backend:** Criar endpoint `GET /notifications/stream` via Server-Sent Events (SSE) autenticado por JWT com cookies/Bearer, isolando canais por usuário/papel:
    - **Canal do Consumidor:** Recebe atualizações de status do pedido em tempo real (`CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`).
    - **Canal do Parceiro (Cozinha):** Alerta sonoro e visual instantâneo na tela de pedidos (`/partner/orders`) assim que um novo pedido é pago (`NOVO_PEDIDO_RECEBIDO`).
  - **Frontend Web:** Conectar ouvinte reativo no Header e nas telas de gestão de pedidos (`/orders` e `/partner/orders`).

### 1.2. 🛵 Fechamento do Ciclo do Pedido e Confirmação de Entrega
- **Problema/Contexto:** O estabelecimento parceiro avança o pedido para `DELIVERED`, mas falta o botão de confirmação e encerramento pelo cliente final.
- **Implementação:**
  - Rota `PATCH /orders/:id/confirm-delivery` para o consumidor registrar o recebimento.
  - Exibição de gatilho imediato de avaliação pós-entrega ("Como estava sua refeição sem contaminação cruzada? Avalie com 1 a 5 estrelas").

### 1.3. 🛒 Carrinho de Compras Persistente & Multi-Itens
- **Problema/Contexto:** Atualmente o checkout cria pedidos diretamente por item. A experiência de e-commerce moderna exige carrinho com múltiplos produtos.
- **Implementação:**
  - Armazenamento em `localStorage` de carrinho com agrupamento estrito por estabelecimento comercial (proibido misturar produtos de lojas distintas no mesmo pedido).
  - Pré-checagem de segurança alimentar combinada (`AllergenEngine`) no carrinho antes de liberar o botão de checkout.

---

## 📱 2. Prioridade Média (Médio Prazo — Paridade e Expansão Mobile)

### 2.1. 📲 Sincronização do App Mobile Flutter (`frontend/mobile-app`)
- **Problema/Contexto:** O aplicativo nativo Flutter foi construído no início do projeto (`FEAT-009`) e precisa refletir as novas diretrizes do Web App.
- **Implementação:**
  - **Pictogramas Internacionais:** Integrar os ícones vetoriais mundiais de alérgenos (*Crossed Grain* da AOECS/ACELBRA para glúten e *Dairy-Free* para leite).
  - **Conformidade LGPD:** Inclusão do checkbox obrigatório de consentimento expresso para dados de saúde (LGPD Art. 11) no cadastro mobile.
  - **Galeria de Fotografias e Rótulos:** Exibir carrossel com fotos em alta resolução de rótulos e laudos no detalhe do produto no Flutter.
  - **Identidade Jurídica:** Exibir badges jurídicas de estabelecimentos (`PJ • Empresa` e `PF • Produtor Individual`).

### 2.2. 🔍 Sugestão Inteligente de Alternativas Seguras
- **Problema/Contexto:** Quando um celíaco encontra um produto incompatível (`BLOCKED` ou `DANGER`), ele não deve sair da plataforma de mãos vazias.
- **Implementação:**
  - Ao retornar `BLOCKED` ou `DANGER`, o `AllergenEngine` ou a rota de catálogo sugere automaticamente até 3 produtos da mesma categoria com status `SAFE` e 100% de compatibilidade com o perfil do usuário logado.

---

## 🏢 3. Prioridade Estrutural (Longo Prazo — Governança, Compliance & BI)

### 3.1. 📅 Validade e Renovação Automática de Laudos de Glúten
- **Problema/Contexto:** Laudos laboratoriais de glúten (< 20 ppm) e certificações técnicas possuem validade jurídica finita.
- **Implementação:**
  - Adicionar coluna `expires_at` na tabela `product_certifications`.
  - Rotina agendada diária (Cron job) disparando notificações por e-mail ao parceiro 30 dias antes do vencimento.
  - Inativação automática do selo auditado (`EXPIRED`) caso não seja renovado a tempo, recalculando a confiabilidade do produto.

### 3.2. 📊 Painel de Métricas e Relatórios Administrativos (BI CeLiLac)
- **Problema/Contexto:** Falta um dashboard executivo consolidando o crescimento e a operação do marketplace.
- **Implementação:**
  - Painel administrativo em `/admin/metrics` com gráficos de:
    - Volume financeiro transacionado (GMV) e receita de split (12% da plataforma).
    - Produtos e categorias mais buscados por celíacos.
    - Índice de denúncias resolvidas vs pendentes.
    - Ranking de estabelecimentos parceiros mais seguros e bem avaliados.

---

## 📋 Resumo Consolidado do Backlog Técnico

| Épico / Funcionalidade | Complexidade Estimada | Superfície Impactada | Valor para o Negócio / Usuário |
| :--- | :---: | :--- | :--- |
| **1. Notificações SSE em Tempo Real** | Média | Backend + Web App | Operação ágil na cozinha e transparência na entrega |
| **2. Confirmação de Entrega & Avaliação** | Baixa | Backend + Web App | Fechamento formal do pedido e geração de prova social |
| **3. Carrinho Multi-Itens Seguro** | Média | Frontend Web | Aumento do ticket médio e melhor UX de compra |
| **4. Paridade do App Mobile Flutter** | Média-Alta | Mobile (Flutter/Dart) | Acessibilidade para usuários de smartphone em trânsito |
| **5. Sugestão de Alternativas Seguras** | Baixa-Média | Backend + Catálogo | Redução do abandono e fidelização do celíaco |
| **6. Gestão de Validade de Laudos** | Média | Domínio + Banco | Garantia legal contínua contra contaminação cruzada |
| **7. Dashboard de BI e Métricas Admin** | Média | Admin Web + Analytics | Visão estratégica de receita e saúde da plataforma |
