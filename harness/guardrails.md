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

