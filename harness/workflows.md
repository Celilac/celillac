# Workflows de Desenvolvimento Assistido por IA

## [WF-01] Nova Funcionalidade (Feature)
1. **Analise:** Ler `docs/PRD.md` e `docs/DOMAIN_MODEL.md`.
2. **Plano:** Criar `docs/plans/FEAT-XXX.md` detalhando mudanças em cada camada da Clean Arch.
3. **Domínio:** Definir Entidades e Value Objects.
4. **Testes:** Criar testes unitários em `backend/tests/unit`.
5. **Implementação:** Seguir a regra de dependência (Infra -> Application -> Domain).
6. **Validação:** Rodar `docker-compose up` e validar integração.

## [WF-02] Alteração Crítica (Allergen Engine)
1. **Trava:** Notificar humano antes de iniciar.
2. **Impacto:** Descrever em `docs/plans/` o impacto na segurança alimentar.
3. **Regressão:** Executar suite de testes de alérgenos existente.
