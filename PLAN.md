# Plano de Implementação: Hook de Pre-commit e Regras de Versionamento

Este plano descreve as alterações para adicionar um hook de pre-commit e atualizar os guias de desenvolvimento para evitar commits acidentais de arquivos proibidos (como `node_modules/`, `dist/` e `coverage/`).

## Alterações Propostas

### 1. Script de Pre-commit
- Criar o arquivo `harness/hooks/pre-commit` com o seguinte script:
  - Listar arquivos em staging usando `git diff --cached --name-only`.
  - Rejeitar o commit se algum arquivo contiver no caminho:
    - `node_modules/`
    - `dist/`
    - `coverage/`
  - Mostrar uma mensagem clara explicando como reverter e limpar o stage.

### 2. Configuração de Hooks do Git
- Configurar o Git para apontar para nossa pasta de hooks:
  ```bash
  git config core.hooksPath harness/hooks
  ```
- Copiar também para `.git/hooks/pre-commit` para garantir funcionamento imediato no workspace local.

### 3. Atualização dos Guardrails
- Adicionar uma seção em `harness/guardrails.md` especificando as regras de versionamento:
  - Uso de `git status` antes de novos setups.
  - Preferir commits seletivos (`git add <arquivos>`) em vez de globais (`git add .`) para novos setups.

---

## Plano de Verificação
- Criar um arquivo dummy em `node_modules/` e verificar se o commit é rejeitado pelo hook.
- Verificar se commits normais de arquivos permitidos continuam funcionando.
