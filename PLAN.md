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
