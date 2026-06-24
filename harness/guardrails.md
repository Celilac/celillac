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
