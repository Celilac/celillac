# PLAN.md - Disparo e Geração de Código OTP na Verificação de E-mail

**Status:** Pronto para execução  
**Escopo:** Frontend Web (`verify-email/page.tsx`, `profile/page.tsx`, `dashboard/page.tsx`, `register/page.tsx`, modais de denúncia/avaliação)

---

## 1. Problema Identificado
Ao clicar em "Verificar E-mail Agora" na página de perfil ou no dashboard, o usuário era apenas redirecionado para a rota `/auth/verify-email`. Como a página não disparava nenhuma requisição para o endpoint de envio de código e o botão de reenvio iniciava bloqueado em 60s, nenhum código OTP era gerado no banco ou logado no terminal do backend.

---

## 2. Escopo de Alterações

1. **Página de Verificação (`src/app/auth/verify-email/page.tsx`):**
   - Inicializar `countdown` em `0` (permitindo reenvio imediato caso o usuário não tenha recebido código).
   - Adicionar lógica no `useEffect` para detectar o parâmetro `?send=true`.
   - Se `?send=true` estiver presente e o usuário estiver autenticado, chamar automaticamente `iamApi.resendEmailVerificationCode(currentToken)`.
   - O backend então gerará o código OTP, salvará no banco e logará no console: `[FakeEmailService]: Enviando código XXXXXX para ...`.
   - Iniciar o contador de 60s e exibir toast de confirmação.

2. **Links de Redirecionamento (`profile`, `dashboard`, modais):**
   - Atualizar os botões "Verificar E-mail Agora" para apontar para `/auth/verify-email?send=true`.
   - Em `register/page.tsx`, passar `?recent=true` para indicar que um código já foi gerado no cadastro.

---

## 3. Validação
- `npx tsc --noEmit` no `frontend/web-app`.
- Acesso à tela de perfil do parceiro, clique no botão e verificação do log do terminal do backend.
