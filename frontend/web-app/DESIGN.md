---
name: CeLiLac Web App
description: Painel autenticado (parceiro, admin, consumidor) da plataforma de segurança alimentar CeLiLac
colors:
  navy-deep: "#244151"
  gold-beacon: "#E1A118"
  emerald-active: "#10B981"
  emerald-active-hover: "#059669"
  emerald-dim: "rgba(16,185,129,0.12)"
  emerald-glow: "rgba(16,185,129,0.35)"
  bg: "#091115"
  surface: "#101C23"
  elevated: "#244151"
  border: "rgba(255,255,255,0.07)"
  border-hover: "rgba(255,255,255,0.15)"
  text: "#F1F5F9"
  text-muted: "#94A3B8"
  text-subtle: "#64748B"
  safe: "#22C55E"
  safe-bg: "rgba(34,197,94,0.1)"
  safe-border: "rgba(34,197,94,0.3)"
  warning: "#EAB308"
  warning-bg: "rgba(234,179,8,0.1)"
  warning-border: "rgba(234,179,8,0.3)"
  danger: "#F59E0B"
  danger-bg: "rgba(245,158,11,0.1)"
  danger-border: "rgba(245,158,11,0.3)"
  blocked: "#EF4444"
  blocked-bg: "rgba(239,68,68,0.12)"
  blocked-border: "rgba(239,68,68,0.35)"
  info: "#3B82F6"
  info-bg: "rgba(59,130,246,0.1)"
  info-border: "rgba(59,130,246,0.3)"
  status-approved: "#34D399"
  status-approved-bg: "rgba(52,211,153,0.15)"
  status-approved-border: "rgba(52,211,153,0.3)"
  status-pending: "#FBBF24"
  status-pending-bg: "rgba(251,191,36,0.15)"
  status-pending-border: "rgba(251,191,36,0.3)"
  status-rejected: "#F87171"
  status-rejected-bg: "rgba(248,113,113,0.15)"
  status-rejected-border: "rgba(248,113,113,0.3)"
  status-suspended: "#A78BFA"
  status-suspended-bg: "rgba(167,139,250,0.15)"
  status-suspended-border: "rgba(167,139,250,0.3)"
typography:
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-primary:
    backgroundColor: "{colors.emerald-active}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.emerald-active-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "24px"
  field-input:
    backgroundColor: "{colors.elevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  risk-badge-safe:
    backgroundColor: "{colors.safe-bg}"
    textColor: "{colors.safe}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  risk-badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  risk-badge-blocked:
    backgroundColor: "{colors.blocked-bg}"
    textColor: "{colors.blocked}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  status-badge-approved:
    backgroundColor: "{colors.status-approved-bg}"
    textColor: "{colors.status-approved}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  status-badge-rejected:
    backgroundColor: "{colors.status-rejected-bg}"
    textColor: "{colors.status-rejected}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
---

# Design System: CeLiLac Web App

## Overview

**Creative North Star: "A Sala de Controle de Confiança"**

O web-app é um painel escuro por padrão, onde cada tela existe para que Carlos (parceiro) e Lara (admin) tomem decisões de segurança alimentar com clareza total. A marca — navy profundo e dourado — vive na periferia: no logo, no wordmark, no painel de marca das telas de autenticação. No dia a dia da interface, uma única cor de ação (esmeralda) governa tudo que é clicável, e os quatro vereditos de risco (SAFE/WARNING/DANGER/BLOCKED) são a voz mais forte do sistema, sempre com ícone e texto ao lado da cor.

A superfície é quase plana — fundo, card e elemento elevado são apenas tons diferentes do mesmo azul-escuro, separados por borda sutil, nunca por sombra decorativa. Sombra é reservada para os poucos momentos que merecem peso: o cartão de login/cadastro, o hover de um botão ou card. Animações são curtas e calmas (fadeIn, slideUp, 0,4–0,6s), reforçando o tom acolhedor e tranquilizador sem nunca competir com um alerta de risco.

**Key Characteristics:**
- Tema escuro como padrão, com tema claro espelhado via `[data-theme='light']`.
- Uma cor de ação só (esmeralda); marca (navy/dourado) fica fora da interação diária.
- Vereditos de risco nunca dependem só de cor — ícone + texto + cor sempre juntos.
- Superfícies quase planas; sombra é reservada para poucos momentos de destaque.
- Botões e badges em pill (raio total); cards e inputs em raio médio/grande.

### Named Rules
**The One Signal Rule.** A qualquer momento, só uma cor forte fala: ou o acento de ação esmeralda, ou a cor de um veredito de risco — nunca as duas competindo na mesma tela.
**The Periphery Rule.** Navy e dourado vivem nas bordas da experiência (logo, wordmark, painel de marca do auth) — nunca no cromo interativo do dia a dia, que permanece esmeralda + neutros.
**The Never-Color-Alone Rule.** Nenhum veredito de risco pode ser identificado só pela cor; ícone e rótulo de texto acompanham sempre (WCAG 2.1 AA, ver PRODUCT.md).

## Colors

Paleta de base fria e escura, com um único acento quente reservado à marca e um vocabulário semântico de risco que é a cor mais informativa do sistema.

### Primary
- **Esmeralda Ativa** (`#10B981`): a única cor de ação do sistema — botão primário, estado ativo da navegação, anel de foco de campos, glow de destaque. Hover escurece para `#059669`.

### Secondary
- **Navy Profundo** (`#244151`): identidade de marca — fundo do painel de marca no login/cadastro, base do wordmark, superfície "elevated" no tema escuro. Não aparece em botões ou estados interativos comuns.

### Tertiary
- **Dourado Farol** (`#E1A118`): acento de marca raro — letra final do wordmark ("Lac"), glow radial do painel de auth. Não deve migrar para chrome de uso diário.

### Neutral
- **Fundo** (`#091115` escuro / `#FCF4E3` claro): base da página.
- **Superfície** (`#101C23` escuro / `#FFFFFF` claro): cards, sidebar, topbar.
- **Texto** (`#F1F5F9` escuro / `#1C2B33` claro), **Texto Muted** (`#94A3B8` / `#51616B`), **Texto Subtle** (`#64748B` / `#7C8B93`).
- **Borda** (`rgba(255,255,255,0.07)` escuro / `rgba(36,65,81,0.10)` claro), com variante hover mais visível.

### Risco (Status Semântico)
Os quatro vereditos do `AllergenEngine` — nunca calculados no frontend (ver `docs/FRONTEND_STRATEGY.md`) — têm cor, fundo e borda próprios. **O tema escuro (`#22C55E`/`#EAB308`/`#F59E0B`/`#EF4444`) e o tema claro usam tons diferentes de propósito**: o tom cru do tema escuro reprova contraste WCAG AA sobre fundo claro (chegava a ~1,9:1 no amarelo), então o tema claro escurece os quatro para manter ≥4,5:1:
- **Verde Seguro**: `SAFE` — `#22C55E` escuro / `#15803D` claro.
- **Amarelo Atenção**: `WARNING` — `#EAB308` escuro / `#854D0E` claro.
- **Âmbar Perigo**: `DANGER` — `#F59E0B` escuro / `#9A3412` claro.
- **Vermelho Bloqueado**: `BLOCKED` — `#EF4444` escuro / `#B91C1C` claro — o único veredito com badge em fonte maior (`--text-body` vs. `--text-label`), reforçando que é o estado mais grave do sistema.

### Status Administrativo
Cadastro de parceiro (aprovado/pendente/rejeitado/suspenso) usa uma paleta própria, deliberadamente separada da paleta de Risco acima — são eixos diferentes (estado de um cadastro vs. veredito de segurança alimentar de um produto) e nunca devem compartilhar token:
- **Aprovado** (`#34D399`), **Pendente** (`#FBBF24`), **Rejeitado** (`#F87171`), **Suspenso** (`#A78BFA`).

### Named Rules
**The Rarity Rule.** Dourado aparece só em dois lugares (wordmark, glow do painel de auth); sua raridade é o que o torna especial.
**The Blocked-Is-Loudest Rule.** `BLOCKED` nunca pode parecer visualmente mais discreto que `DANGER` — hoje é o único badge com tamanho de fonte maior; essa hierarquia não pode ser invertida ou suavizada.
**The Separate-Axes Rule.** Risco alimentar (SAFE/WARNING/DANGER/BLOCKED) e status administrativo (aprovado/pendente/rejeitado/suspenso) nunca compartilham token de cor, mesmo quando o valor hexadecimal coincidiria — são conceitos diferentes e precisam poder evoluir independentemente.

## Typography

**Display/Body/Label Font:** Inter (com fallback `-apple-system, BlinkMacSystemFont, sans-serif`), pesos 300–900 carregados via Google Fonts.

**Character:** Uma única família sans geométrica cobre todo o sistema — a hierarquia nasce do salto de peso (400 → 700 → 800), não de uma escala de tamanhos elaborada, mantendo a leitura calma e o painel legível em qualquer densidade de dado.

### Hierarchy
Os 4 papéis são CSS custom properties reais (`--text-headline`, `--text-title`, `--text-body`, `--text-label` em `globals.css`), não só convenção — todo tamanho de fonte do sistema referencia um desses 4 tokens.
- **Headline** (`var(--text-headline)`, 800, `clamp(1.75rem, 3vw, 2.75rem)`, -0,03em): títulos de página (dashboard, page-title).
- **Title** (`var(--text-title)`, 700, 1,25rem): títulos de card, título de autenticação, cabeçalhos de seção.
- **Body** (`var(--text-body)`, 400–600, 0,9rem): texto corrido, rótulos de formulário, conteúdo de card.
- **Label** (`var(--text-label)`, 700, 0,8rem, uppercase, 0,06em): rótulos de campo, eyebrow, texto de badge/risk-badge.

Exceções documentadas (não migradas para os 4 papéis, por serem tratamento de marca/ícone, não hierarquia de conteúdo): `.brand-wordmark` e `.auth-brand-panel-wordmark` (wordmark da marca) e o glifo do botão hambúrguer/remover (ícone, não texto).

### Named Rules
**The Weight Contrast Rule.** Hierarquia é carregada por contraste de peso (400→700→800) mais do que por salto de tamanho — a escala tipográfica permanece compacta, mas a hierarquia continua inequívoca.

## Layout

`page-container` centraliza o conteúdo com largura máxima de 1100px e padding responsivo (`--space-8 --space-6`). O `topbar` é sticky no topo (`z-index: 10`).

**Navegação responsiva:** abaixo de 768px, `.topbar-actions` colapsa atrás de um botão hambúrguer (`.topbar-nav-toggle`, 44×44px) em vez de tentar espremer até 8 links numa única linha; acima de 768px a navegação permanece horizontal, como sempre foi. Todo botão dentro do menu mobile aberto usa altura mínima de 44px (alvo de toque).

Telas de autenticação usam um cartão único centralizado (`auth-split-card`, máx. 420px) que se expande para duas colunas de 420px (formulário + painel de marca) a partir de 1024px — o painel de marca só existe em telas grandes.

Grades de card (`cards-grid`, `.grid` em partner/dashboard) usam `repeat(auto-fit/auto-fill, minmax(280–320px, 1fr))`: refluxo responsivo sem breakpoints explícitos até o ponto de quebra de layout de duas colunas (768px no dashboard de detalhes).

## Elevation & Depth

O sistema é quase plano por padrão: `bg`, `surface` e `elevated` são apenas tons diferentes do mesmo azul-escuro, separados por borda sutil — não por sombra. Sombra (`--shadow-sm/md`) aparece só onde o momento pesa de fato: o cartão de login/cadastro (que carrega `--shadow-md` em repouso, por ser a entrada da experiência) e o hover de cards/botões (mudança de cor de borda, ou glow no botão primário).

### Shadow Vocabulary
- **sm** (`0 1px 8px rgba(0,0,0,0.3)`): uso pontual, elementos pequenos em destaque.
- **md** (`0 4px 20px rgba(0,0,0,0.4)`): cartão de autenticação em repouso; hover de elementos maiores.
- **glow** (`0 0 30px var(--color-emerald-glow)`): resposta ao hover do botão primário.

### Named Rules
**The Earned Shadow Rule.** Sombra só aparece onde o momento importa (entrada de autenticação, hover de destaque); cards e inputs comuns permanecem planos, separados só por borda.

## Shapes

Escala de raio: `sm` (6px, detalhes pequenos), `md` (12px, inputs e nav-links), `lg` (16px, cards e cartão de autenticação), `full` (9999px, botões e badges). Nenhum canto reto aparece na camada interativa — toda ação clicável (botão, badge de risco) é uma pílula; contêineres usam raio médio/grande.

## Components

O caráter geral é **calmo e confiável**: pouca decoração, cor usada com parcimônia — a esmeralda aparece só em ações primárias e estado ativo, nunca como enfeite.

### Buttons
- **Shape:** pílula (`border-radius: 9999px`).
- **Primary** (`.btn-em`): fundo esmeralda ativa, texto branco; hover escurece para `#059669` + `shadow-glow` + leve `translateY(-1px)`.
- **Ghost** (`.btn-ghost`): fundo transparente, borda sutil, texto muted; hover ganha fundo translúcido claro e texto normal.
- **Disabled:** opacidade 0,4, sem transform.

### Risk Badge (componente-assinatura)
- **Shape:** pílula, uppercase, letter-spacing 0,05em.
- **Regra:** ícone + cor + texto sempre juntos — nunca só cor (`RiskBadge.tsx` já implementa isso corretamente). `BLOCKED` usa fonte maior (0,9rem) que os demais (0,8rem).
- **Cores:** cada variante (SAFE/WARNING/DANGER/BLOCKED) usa seu par cor/fundo/borda semântico dedicado.

### Cards / Containers
- **Corner Style:** 16px (`--radius-lg`).
- **Background:** `--color-surface`.
- **Shadow Strategy:** nenhuma em repouso; só troca de cor de borda no hover (ver Elevation & Depth).
- **Border:** 1px sutil, mais visível no hover.
- **Internal Padding:** `--space-6` (1,5rem).

### Inputs / Fields
- **Style:** fundo `--color-elevated`, borda 1px sutil, raio médio (12px).
- **Focus:** borda muda para esmeralda + anel de 3px em `--color-emerald-dim`.
- **Error:** texto do erro na cor `--color-blocked`.

### Navigation
- **Topbar:** logo + wordmark à esquerda (dourado só na última sílaba), ações à direita como botões ghost com ícone+label; tagline da marca só aparece a partir de 640px.
- **Menu mobile (< 768px):** as mesmas ações colapsam atrás de um botão hambúrguer (`aria-expanded`, `aria-controls`) num painel empilhado de largura total, cada item com altura mínima de 44px.

### Status Badge (parceiro/admin)
- **Shape:** pílula, uppercase, letter-spacing 0,05em — mesma forma do Risk Badge, mas cores da paleta de Status Administrativo (nunca da paleta de Risco).
- **Variantes:** aprovado/pendente/rejeitado/suspenso, cada uma com par cor/fundo/borda dedicado.

### Toast / Snackbar (componente-assinatura)
- **Style:** bloco de ícone sólido de 54px à esquerda carregando a cor forte da variante (safe/error/warning/info); corpo da mensagem em fundo neutro (`--color-elevated`) com texto na cor de texto padrão — a cor da variante nunca invade o texto da mensagem, só o bloco do ícone e a borda do cartão.

## Do's and Don'ts

### Do:
- **Do** parear todo veredito de risco com ícone + texto + cor — nunca só cor (WCAG 2.1 AA, ver PRODUCT.md).
- **Do** reservar esmeralda para ações/interação primária; reservar dourado só para marca (wordmark, painel de auth).
- **Do** usar raio pílula em elementos acionáveis (botões, badges) e raio médio/grande em contêineres.
- **Do** manter sombra "conquistada" — só no cartão de autenticação e em estados de hover/destaque.
- **Do** manter `BLOCKED` como o veredito visualmente mais forte do sistema (nunca mais discreto que `DANGER`).
- **Do** dar semântica de modal a todo diálogo customizado (`role="dialog"`, `aria-modal`, fechar com Escape, foco inicial no diálogo) — `partner/page.tsx` e o modal de moderação em `admin/partners` já seguem este padrão.
- **Do** oferecer uma alternativa a `prefers-reduced-motion` que preserve a mudança de estado (o conteúdo aparece) e remova só o deslocamento/tempo — nunca um "kill" global que apagaria também o feedback de foco.
- **Do** colapsar navegação com muitos itens (>4-5) atrás de um menu abaixo de 768px, com alvos de toque ≥44px.

### Don't:
- **Don't** introduzir glassmorphism/blur no sistema canônico — a linguagem plana-com-borda é a fonte da verdade. `partner.module.css` e `dashboard.module.css` usavam blur/gradiente/hex cru; foram migrados para os tokens e para a linguagem plana — não reintroduzir esse padrão em telas novas.
- **Don't** deixar um componente estilizado com tokens `:root` reintroduzir um valor literal de tema escuro ou claro que quebre sob `[data-theme='light']` — o bug original dos badges de risco (contraste ~1,9:1 no tema claro) veio exatamente de um bloco de override incompleto.
- **Don't** misturar a cor de ação (esmeralda) com a cor de um veredito de risco na mesma composição — só uma fala por vez (The One Signal Rule).
- **Don't** compartilhar token de cor entre Risco alimentar e Status administrativo, mesmo que o hex coincida (The Separate-Axes Rule).
- **Don't** deixar um veredito de risco "cair" visualmente em cima de outro por falta de uma classe/variante dedicada (bug já corrigido no dashboard: `WARNING` renderizava idêntico a `BLOCKED` por falta de uma classe própria) — os 4 riskLevel do `AllergenEngine` sempre precisam de 4 tratamentos visuais distintos.
