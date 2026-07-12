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
# Plano de Implementação: Melhorias no Cadastro Web

## Objetivo
Atualizar a tela web de criação de conta para exigir senha forte no frontend, incluir confirmação de senha, adicionar ícone para visualizar/ocultar senha e ajustar os rótulos de tipo de conta.

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
