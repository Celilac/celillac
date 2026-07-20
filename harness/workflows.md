# Workflows de Desenvolvimento Assistido por IA

> Este arquivo espelha os workflows definidos em `AGENTS.md`.
> Em caso de divergência, `AGENTS.md` é a fonte de verdade.

---

## [WF-01] Nova Funcionalidade (Feature)
1. **Analise:** Ler `docs/PRD.md`, `docs/DOMAIN_MODEL.md` e `docs/ARCHITECTURE.md`.
2. **Plano:** Criar `docs/plans/FEAT-XXX.md` detalhando mudanças em cada camada da Clean Arch.
3. **Domínio:** Definir Entidades e Value Objects no `domain/`.
4. **Testes:** Criar testes unitários em `backend/tests/unit` (TDD).
5. **Implementação:** Seguir a regra de dependência (domain ← application ← infrastructure ← interfaces).
6. **Validação:** Rodar `npm test` e `npm run build`.
7. **Entrega:** Atualizar `docs/features/`, `README.md`, `CHANGELOG.md`, `docs/API_CONTRACTS.md` sem duplicar `DOMAIN_MODEL.md`.

---

## [WF-02] Alteração Crítica (Allergen Engine) ⚠️
1. **Trava:** Notificar humano **antes de iniciar** qualquer análise ou código.
2. **Impacto:** Descrever em `docs/plans/` o impacto na segurança alimentar.
3. **Leitura:** Ler `docs/ALLERGEN_ENGINE.md` e `docs/DOMAIN_MODEL.md` na íntegra.
4. **Regressão:** Executar suite de testes de alérgenos existente (`AllergenEngine.spec.ts`).
5. **Aguardar:** Aprovação humana + auditoria de segurança antes de prosseguir.

---

## [WF-03] Correção de Bug
1. **Reproduzir:** Analisar logs ou código existente para isolar o problema.
2. **Teste falho:** Criar teste unitário que reproduz e falha com o bug.
3. **Corrigir:** A menor alteração possível para não causar regressões.
4. **Validar:** Rodar testes em toda a suíte (`npm test`) para confirmar que passou.
5. **Explicar:** Descrever a causa raiz e a correção no relatório final.

---

## [WF-04] Alteração de Banco de Dados
1. **Leitura:** Ler `docs/DATABASE.md` na íntegra.
2. **Proposta:** Descrever a alteração (nova tabela, coluna, constraint ou índice).
3. **Impacto:** Explicar o impacto sobre dados existentes e performance.
4. **Aprovação:** Aguardar autorização humana se envolver migration estrutural.
5. **Migration:** Criar migration numerada em `harness/scripts/migrations/`.
6. **Testes:** Rodar testes para garantir que a camada de repositório continua íntegra.
7. **Documentar:** Atualizar `docs/DATABASE.md` com as novas tabelas/colunas.

