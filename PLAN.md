# PLAN.md - Submissão Automática para Análise no Cadastro de Parceiros

**Status:** Aprovado e em Execução  
**Escopo:** Backend (Application, Casos de Uso, DTOs, Testes Automatizados) & Frontend Web (Páginas de Cadastro, Gestão e Toasts)

---

## 1. Contexto e Motivação
Atualmente, quando um usuário parceiro preenche o formulário completo de cadastro de um estabelecimento comercial (`/partner/register`) e salva com sucesso, o estabelecimento é registrado no banco com o status `DRAFT` (Rascunho). 
Isso gera grande atrito e confusão de UX:
- O parceiro acredita que o cadastro já foi finalizado e submetido para a plataforma.
- No entanto, ele permanece invisível e estagnado em "Rascunho", exigindo que o usuário descubra que precisa acessar outra tela interna para clicar manualmente em "Enviar para Revisão".
- O status `DRAFT` deve existir apenas para cadastros com dados incompletos ou rascunhos voluntários (ex: autosave ou saída antecipada). Ao submeter o formulário completo, o estabelecimento deve ir diretamente para `PENDING_REVIEW` (Sob Análise).

---

## 2. Etapas de Execução

### Fase 1: Atualização da Lógica de Aplicação no Backend
- Em `backend/src/application/partner/RegisterPartnerUseCase.ts`:
  - Adicionar suporte a `isDraft?: boolean` no `RegisterPartnerDTO`.
  - Definir o status de aprovação inicial:
    - Se o criador for `ADMIN`: `APPROVED` (e `ACTIVE`).
    - Se for `isDraft === true`: `DRAFT` (e `INACTIVE`).
    - Caso contrário (padrão de submissão completa por `PARCEIRO`): `PENDING_REVIEW` (e `INACTIVE`).

### Fase 2: Atualização dos Testes Automatizados (TDD)
- Em `backend/tests/unit/application/partner/RegisterPartnerUseCase.spec.ts`:
  - Atualizar o teste principal de cadastro por `PARCEIRO`: validar que `approvalStatus` agora é `PENDING_REVIEW`.
  - Adicionar teste cobrindo a opção explícita de `isDraft: true` resultando em `DRAFT`.
  - Manter teste de usuário `ADMIN` nascendo como `APPROVED`.

### Fase 3: Ajustes no Frontend Web
- Em `frontend/web-app/src/app/partner/register/page.tsx`:
  - Atualizar o feedback visual (toast) após o cadastro bem-sucedido:
    - Se `APPROVED` (admin): *"Estabelecimento cadastrado e ativado com sucesso!"*
    - Se `PENDING_REVIEW`: *"Estabelecimento cadastrado com sucesso e enviado para análise e moderação da plataforma!"*
    - Ação: Redirecionar para `/partner` onde o usuário visualiza o card com o badge de *Pendente de Revisão*.
- Revisar badge e labels em `frontend/web-app/src/app/partner/page.tsx` para assegurar coerência textual ("Sob Análise" / "Pendente de Revisão").

### Fase 4: Validação, Build e Documentação
- Executar suíte de testes com `npm test` no backend.
- Executar build do backend (`npm run build`).
- Atualizar documentação:
  - `docs/features/partner.md`
  - `docs/API_CONTRACTS.md`
  - `CHANGELOG.md`
  - `walkthrough.md`
