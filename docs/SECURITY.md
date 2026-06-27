# SECURITY.md - Política de Segurança do Workspace

## Gestão de Segredos
- **NUNCA** commite arquivos `.env` ou chaves privadas.
- Utilize o `infra/docker/docker-compose.yml` apenas com credenciais de desenvolvimento.

## Segurança Alimentar (Allergen Safety)
- Qualquer código que processe a string "glúten" ou "traços de" é considerado de **Alto Risco**.
- Testes de mutação devem ser aplicados ao `AllergenEngine`.

## Proteção de Dados (LGPD)
- O agente não tem acesso a nomes reais, CPFs ou endereços.
- O banco de dados local deve ser populado apenas com o script `harness/scripts/init_db.sql`.
