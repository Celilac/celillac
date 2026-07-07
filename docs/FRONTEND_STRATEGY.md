# FRONTEND_STRATEGY.md - Diretrizes do Harness para Interfaces

Este documento serve como **guardrail (harness)** obrigatório para qualquer Agente de IA que atue nas interfaces do CeLiLac. Ao implementar funcionalidades nas camadas visuais, o Agente DEVE obedecer rigorosamente às regras abaixo, separadas por contexto.

---

## ⚙️ Princípio Central: Lógica de Negócio NUNCA no Frontend ou Mobile

Este é o guardrail mais crítico do projeto. Qualquer agente que violar esta regra introduz um risco de segurança alimentar real.

### A Regra

> **A decisão de se um produto é seguro para um usuário pertence exclusivamente ao `AllergenEngine` no backend.**

O frontend e o mobile são **camadas de apresentação**. Elas exibem resultados — nunca os calculam.

### Por que isso é crítico aqui

O CeLiLac detecta **contaminação cruzada** (traços de alérgenos que não aparecem nos ingredientes principais). Esta lógica é complexa, validada por testes unitários e pode mudar. Se for duplicada no frontend:
- Um bug no frontend pode dizer "SEGURO" para um produto que mataria um celíaco.
- A mudança na regra precisaria ser propagada para Web, Mobile e futuros clientes.
- O backend perderia a condição de ser a única fonte da verdade.

### O que o Agente DEVE fazer

| ✅ Permitido (exibição) | ❌ Proibido (cálculo) |
|:------------------------|:---------------------|
| Exibir o `riskLevel` retornado pela API | Verificar `hasGluten` para decidir se é seguro |
| Exibir o campo `reasoning` da API | Analisar `crossContamination` na tela |
| Colorir o alerta com base no `riskLevel` | Comparar ingredientes com a lista de alérgenos do perfil |
| Exibir `isCompatible` da API | Calcular qualquer score ou risco localmente |

### Padrão de implementação obrigatório

```
Usuário escaneia/busca produto
         │
         ▼
Tela busca productId no catálogo  ← Dados brutos apenas para exibição (nome, marca)
         │
         ▼
Tela chama POST /compatibility/check  ← ÚNICA fonte de veredicto de segurança
         │
         ▼
API retorna { riskLevel, reasoning, conflicts }
         │
         ▼
Tela renderiza AlertBanner com o resultado  ← Só exibição, zero interpretação
```

### Exemplo de violação (PROIBIDO)

```tsx
// ❌ NUNCA FAÇA ISSO — lógica de domínio no frontend
const isSafe = !product.hasGluten && !product.crossContamination.includes('glúten');
```

### Exemplo correto (OBRIGATÓRIO)

```tsx
// ✅ SEMPRE FAÇA ISSO — delegar ao backend
const report = await checkCompatibility(user.id, product.id);
// report.riskLevel é a única fonte da verdade
```

---


## 1. Frontend Web da Aplicação (App Autenticado)
Esta é a interface principal de uso do sistema para usuários logados e administradores.

- **Telas Autenticadas:**
  - Todas as rotas devem ser protegidas por middlewares ou HOCs (Higher-Order Components) que verifiquem a presença e validade do JWT (armazenado em memória, nunca localmente sem criptografia).
  - Redirecionar imediatamente para a tela de Login (`/auth/login`) caso o token expire ou não exista.

- **Consumo da API:**
  - **Proibido** implementar lógica de domínio no frontend. Toda regra de negócio (ex: cálculo de risco, compatibilidade) deve ser delegada aos endpoints definidos em `API_CONTRACTS.md`.
  - Utilizar uma camada única de serviços para centralizar as chamadas HTTP e injetar o token de autorização.

- **Estados de Carregamento (Loading):**
  - É obrigatório exibir feedback visual de carregamento (spinners, skeletons) em **todas** as requisições assíncronas.
  - A interface nunca deve parecer "congelada" durante o processamento de regras ou listagens.

- **Tratamento de Erros:**
  - Capturar erros de rede e respostas HTTP (4xx, 5xx) e exibi-los de forma amigável via *Toasts* ou *Snackbars*.
  - Nunca exibir a stack trace ou mensagens cruas de erro do backend para o usuário final.

- **Exibição de Alertas Alimentares:**
  - Seguir estritamente o `riskLevel` retornado pelo `AllergenEngine`:
    - `SAFE` (Verde), `WARNING` (Amarelo), `DANGER` (Laranja), `BLOCKED` (Vermelho com destaque máximo de perigo).
  - O motivo do alerta (campo `reasoning`) deve ser exibido com clareza para justificar o bloqueio.

- **Formulários de Cadastro (Produtos e Perfil Alimentar):**
  - Validar campos obrigatórios no frontend antes do envio para evitar requisições inválidas desnecessárias na API.
  - Garantir que o preenchimento de `cross_contamination` em produtos tenha instruções claras e destaque na UI, devido à sua criticidade para celíacos.

---

## 2. Landing Page
A Landing Page é a vitrine pública do projeto e porta de entrada de novos usuários.

- **Conteúdo Institucional e Proposta:**
  - Focar em SEO, semântica do HTML, performance de carregamento (LCP/FCP) e acessibilidade.
  - Apresentar claramente a missão do CeLiLac: "Segurança alimentar para celíacos validando a fundo a contaminação cruzada".

- **Captação de Interessados (Leads):**
  - Implementar chamadas para ação (CTAs) claras direcionando para o cadastro ou download.
  - Formulários de newsletter ou contato devem ser simples, limpos e com validação instantânea.

- **Isolamento de Lógica:**
  - **Regra de Ouro:** Não misturar lógica da aplicação com a Landing Page.
  - A Landing Page não requer gerenciamento de estado complexo (como Zustand/Redux) nem interceptadores de autenticação. Deve permanecer leve e renderizada de forma estática (SSG) sempre que possível.

---

## 3. Aplicativo Mobile
O aplicativo é a ferramenta de campo do consumidor, usado durante as compras e refeições.

- **Foco na Experiência do Consumidor:**
  - O Agente deve priorizar fluxos rápidos com o mínimo de cliques possíveis.
  - Projetar considerando o uso em movimento (supermercado) com botões largos e fáceis de tocar.

- **Busca de Produtos e Perfil Alimentar:**
  - O motor de busca (ou scanner de código de barras) deve ser o elemento central da Home.
  - O Perfil Alimentar configurado pelo usuário (ex: "Celíaco - FATAL") deve estar sempre facilmente acessível para o usuário saber qual regra está sendo checada naquele momento.

- **Alertas Claros:**
  - O resultado da compatibilidade alimentar na tela do celular deve ser imediato, incisivo e altamente visual.
  - Produtos marcados como `BLOCKED` devem adotar o uso de cores fortes (Vermelho), ícones de restrição e, se possível na plataforma nativa, feedback tátil (vibração).

- **Consumo dos Mesmos Contratos da API:**
  - O Agente DEVE usar exatamente os mesmos endpoints descritos em `API_CONTRACTS.md` que são consumidos pela Web. Não é permitido criar rotas ou lógicas segregadas no backend exclusivamente para o Mobile sem aprovação prévia.
