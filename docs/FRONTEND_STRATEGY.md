# FRONTEND_STRATEGY.md - Regras para Interfaces

## Frontend Web (Aplicação)
- **Tecnologia:** React / Next.js sugerido.
- **Regras:**
    - Alertas alimentares devem ter destaque visual (vermelho/ícones de perigo).
    - Formulários de cadastro de produto devem validar a presença de alérgenos comuns.
    - Nunca duplicar lógica de cálculo de compatibilidade no Front; usar sempre o retorno do Backend.

## Landing Page
- **Foco:** SEO e Conversão (interessados).
- **Isolamento:** Não deve compartilhar lógica de autenticação com a aplicação principal.

## Aplicativo Mobile
- **Foco:** Câmera/Scanner de código de barras para verificação rápida.
- **Alertas:** Notificações push para recalls de produtos que o usuário marcou como favorito.
