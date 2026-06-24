# DEFINITION_OF_DONE.md - Critérios de Aceite

Para que uma tarefa seja considerada completa pelo agente, ela deve:

- [ ] Estar em conformidade com o `DOMAIN_MODEL.md`.
- [ ] Seguir a Clean Architecture (dependências apontando para dentro).
- [ ] Possuir testes unitários com cobertura mínima de 80% no domínio.
- [ ] Passar no Linter e no Build (`npm run build`).
- [ ] Ter documentação de API atualizada (se houver novo endpoint).
- [ ] Não conter segredos ou credenciais expostas.
- [ ] Ter sido validada contra o Motor de Alérgenos (se afetar compatibilidade).
- [ ] Gerar um relatório final detalhando o que foi alterado.
