# Plano de Implementação: Ajuste de Navegação do Perfil Alimentar

## Objetivo
Remover as ações de navegação redundantes da tela de Perfil Alimentar: o botão HOME do topo e o botão “Voltar” do card.

## Escopo

### 1. Navegação
- Remover o link HOME do cabeçalho da página de perfil.
- Remover o botão “Voltar” do formulário.
- Preservar o controle de tema e a identidade visual.

### 2. Formulário
- Preservar a lógica de carregamento, criação, edição e salvamento do perfil.
- Manter o layout responsivo e a hierarquia visual já aplicada.

## Plano de Verificação
- Validar TypeScript/diagnósticos dos arquivos alterados.
- Executar o build do frontend web.
- Conferir responsividade e estados de foco/disabled por inspeção dos estilos.

---

# Plano de Implementação: Hook de Pre-commit e Regras de Versionamento

Este plano descreve as alterações para adicionar um hook de pre-commit e atualizar os guias de desenvolvimento para evitar commits acidentais de arquivos proibidos (como `node_modules/`, `dist/` e `coverage/`).

## Alterações Propostas

### 1. Script de Pre-commit
- Criar o arquivo `harness/hooks/pre-commit` para validar arquivos em staging.
- Rejeitar commits que incluam `node_modules/`, `dist/` ou `coverage/`.

### 2. Configuração e guardrails
- Configurar o Git para apontar para a pasta de hooks.
- Documentar o uso de commits seletivos nos guardrails.

## Plano de Verificação
- Verificar que arquivos proibidos sejam rejeitados pelo hook.
- Verificar que commits normais de arquivos permitidos continuem funcionando.

---

# Plano de Implementação: Melhorias no Cadastro Web

## Objetivo
Atualizar a tela web de criação de conta para exigir senha forte no frontend, incluir confirmação de senha, adicionar ícone para visualizar/ocultar senha e ajustar os rótulos de tipo de conta.

## Alterações Propostas

### 1. Fluxo de senha
- Adicionar campo de confirmação de senha.
- Validar no frontend que a senha:
  - tenha pelo menos 8 caracteres;
  - contenha letra maiúscula;
  - contenha letra minúscula;
  - contenha número;
  - contenha símbolo.
- Impedir envio quando a confirmação não corresponder.

### 2. Usabilidade dos campos de senha
- Adicionar botão com ícone para alternar entre mostrar e ocultar senha.
- Reutilizar o mesmo padrão visual para senha e confirmação.

### 3. Tipo de conta
- Atualizar os textos exibidos no select para:
  - `Eu possuo restrições/Opto por comida saudável`
  - `Sou/Quero ser parceiro/fornecedor`
- Manter os valores de domínio enviados para a API como `CELIACO` e `PARCEIRO`.

## Plano de Verificação
- Validar TypeScript/diagnósticos dos arquivos alterados.
- Executar uma checagem focada do frontend web para garantir que a tela compila sem erro.

---

# Plano de Implementação: Reordenação do Fluxo de Cadastro, Validação de E-mail (OTP) e Perfil

## Objetivo
Reordenar o fluxo pós-criação de conta para que o usuário seja obrigatoriamente direcionado para a tela de verificação de e-mail OTP (`/auth/verify-email`) logo após criar a conta. Após informar e validar o código OTP de 6 dígitos, o usuário é direcionado para a página de perfil (`/profile`) para completar o cadastro com suas informações pessoais (data de nascimento, telefone, etc.). Após preencher e salvar o perfil, ele pode seguir para o dashboard (`/dashboard`).

## Alterações Realizadas

### 1. Cadastro (`/auth/register`)
- Alterar redirecionamento pós-registro de `/profile` para `/auth/verify-email`.

### 2. Validação de E-mail por OTP (`/auth/verify-email`)
- Alterar redirecionamento pós-validação de `/dashboard` para `/profile`.

### 3. Perfil (`/profile`)
- Ao salvar as alterações de perfil com sucesso (`handleSave`), redirecionar o usuário para `/dashboard`.

## Plano de Verificação
- Verificar a compilação do TypeScript e ausência de erros de sintaxe.
- Executar o build do frontend web com `npm run build`.

---

# Plano de Implementação: Bloqueio de Ações de Interação (Avaliar, Favoritar e Denunciar) para E-mails Não Verificados

## Objetivo
Garantir a segurança alimentar e a integridade dos dados da comunidade bloqueando qualquer ação de escrita (avaliar produtos/parceiros, salvar favoritos, enviar denúncias e cadastrar parceiros/produtos) para usuários cujo e-mail ainda não tenha sido confirmado via código OTP.

## Alterações Realizadas

### 1. Backend (`backend`)
- `AuthMiddleware.ts`: Criado o middleware `verifiedEmailOnlyMiddleware`, que consulta `users.is_email_verified` e retorna `403 Forbidden` (`EMAIL_NOT_VERIFIED`) para contas não verificadas.
- Aplicado nas rotas:
  - `POST /reviews` (avaliações)
  - `POST /favorites` e `DELETE /favorites/:targetId` (favoritos)
  - `POST /reports` (denúncias)
  - `POST /partners` (parceiros)
  - `POST /products` (catálogo)
- Criados testes unitários para `verifiedEmailOnlyMiddleware` em `AuthMiddleware.spec.ts`.

### 2. Frontend (`frontend/web-app`)
- `ReviewModal.tsx`: Checagem preventiva de `isEmailVerified`, banner explicativo com link para `/auth/verify-email` e bloqueio do botão de envio.
- `ReportModal.tsx`: Checagem preventiva de `isEmailVerified`, banner explicativo com link para `/auth/verify-email` e bloqueio do botão de envio.
- `FavoriteButton.tsx`: Tratamento e alerta orientativo caso o usuário tente favoritar sem ter validado o e-mail.

## Plano de Verificação
- Execução de 304 testes unitários no backend com `npm test` (100% de aprovação).
- Verificação de tipos TypeScript no frontend com `npx tsc --noEmit`.

