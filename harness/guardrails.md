# GUARDRAILS.md - Política de Segurança e Limites do Agente

## Princípio do Menor Privilégio
O agente de IA opera em um sandbox isolado. Ele tem acesso apenas ao que é estritamente necessário para o desenvolvimento.

## Comandos Proibidos
- Qualquer comando que tente ler variáveis de ambiente do host (`env`, `printenv`).
- Modificação manual de arquivos em `infra/` sem plano aprovado.
- Deleção de logs ou histórico de commits.

## Ações que EXIGEM Autorização Humana (Checklist)
1. Alterar o motor de alérgenos (`ALLERGEN_ENGINE.md`).
2. Adicionar novas dependências no `package.json`.
3. Alterar scripts de migração de banco de dados.
4. Modificar a lógica de autenticação e permissões no IAM.

## Proteção de Dados
- **Dados Sensíveis:** Nunca utilize dados reais de usuários no ambiente de desenvolvimento local.
- **Seeds:** Utilize apenas os scripts em `harness/scripts/` para gerar dados fictícios.

## Boas Práticas de Commit e Versionamento
- **Verificação do Git Status:** Antes de commitar novos setups de projeto (por exemplo, após rodar `npm install`), execute sempre `git status` para verificar os arquivos que serão adicionados.
- **Commits Seletivos:** Evite comandos globais como `git add .` ou `git add -A` ao realizar commits de setup inicial. Prefira adicionar os arquivos específicos de configuração e código (`git add <arquivo>`).
- **Hook de Pre-commit:** O repositório utiliza um hook de pre-commit localizado em `harness/hooks/pre-commit` para impedir o commit acidental de arquivos de diretórios proibidos (`node_modules/`, `dist/`, `coverage/`). Esse hook rejeitará automaticamente qualquer commit que tente incluir esses arquivos.
- **Hook de Pre-push:** O repositório utiliza um hook `harness/hooks/pre-push` que **bloqueia qualquer push direto para a `main`** no nível local.

## Estratégia de Branches (Branch Strategy)

A branch `main` é a branch de produção e **nunca aceita push direto**. Todo código deve entrar via Pull Request.

| Branch | Propósito | Push Direto | Merge via |
|:-------|:----------|:-----------:|:----------|
| `main` | Produção estável | ❌ Proibido | Pull Request de `develop` |
| `develop` | Integração contínua | ✅ Permitido | Direto ou PR de feature branch |
| `feature/*` | Desenvolvimento de features | ✅ Permitido | PR para `develop` |
| `fix/*` | Correção de bugs | ✅ Permitido | PR para `develop` |
| `hotfix/*` | Correção urgente de produção | ✅ Permitido | PR para `main` e `develop` |

### Proteções Ativas

1. **GitHub Actions `protect-main.yml`:** Workflow que **falha imediatamente** em qualquer push direto na `main`. Funciona como status check obrigatório (configure em *Settings → Branches → Branch protection rules*).
2. **GitHub Actions `ci-develop.yml`:** Pipeline completo de CI (lint, build, testes com cobertura) em todo push e PR na `develop`.
3. **GitHub Actions `ci.yml`:** Validação final apenas em PRs abertos para `main`.
4. **Hook local `pre-push`:** Bloqueia pushes para `main` antes mesmo de chegarem ao GitHub.

### Configuração Obrigatória no GitHub (Branch Protection Rules — `main`)

Após o primeiro push, configure em **Settings → Branches → Add rule** para a branch `main`:

```
✅ Require a pull request before merging
   ✅ Require approvals: 1
✅ Require status checks to pass before merging
   ✅ block-direct-push        (de protect-main.yml)
   ✅ Validação Final — PR para Main  (de ci.yml)
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
```

