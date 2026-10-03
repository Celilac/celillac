# Workflows de Desenvolvimento Assistido por IA

> Este arquivo espelha os workflows definidos em `AGENTS.md`.
> Em caso de divergência, `AGENTS.md` é a fonte de verdade.

---

## [WF-01] Nova Funcionalidade (Feature)
1. **Analise:** Ler `docs/PRD.md`, `docs/DOMAIN_MODEL.md` e `docs/ARCHITECTURE.md`.
2. **Plano Obrigatório:** No Antigravity IDE, criar exclusivamente o artefato nativo `plano_de_implementacao.md` com `RequestFeedback: true` e aguardar aprovação humana. No Claude Code, criar `PLAN.md`.
3. **Branch Isolada Obrigatória:** Puxar a `develop` atualizada (`git checkout develop && git pull origin develop`) e criar nova branch `feat/<nome-da-feature>`. É PROIBIDO commitar features diretamente na `develop`.
4. **Domínio:** Definir Entidades e Value Objects no `domain/`.
5. **Testes:** Criar testes unitários em `backend/tests/unit` (TDD).
6. **Implementação:** Seguir a regra de dependência (domain ← application ← infrastructure ← interfaces).
7. **Validação & Auto-Cura:** Executar `node scripts/agent-verify.mjs` (ou `npm run verify`). Se houver qualquer erro em compilação, testes, paridade ou rotas, **NÃO pare para perguntar**: aplique a correção imediatamente e re-execute até obter 100% verde.
8. **E2E Visual:** Se alterou telas no frontend, validar o fluxo no navegador via subagente (`browser_subagent`).
9. **Entrega & Pull Request:** Atualizar `docs/features/`, `README.md`, `CHANGELOG.md`, `docs/API_CONTRACTS.md` sem duplicar `DOMAIN_MODEL.md`. Abrir PR da branch da feature para a `develop`.

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
2. **Tocar Direto:** Em bugs e fixes, o Agente tem autonomia imediata sem necessidade de plano prévio.
3. **Teste falho:** Criar ou ajustar teste unitário que reproduz o problema e evita regressões.
4. **Corrigir:** A menor alteração possível para restaurar a estabilidade.
5. **Validação & Auto-Cura:** Rodar `node scripts/agent-verify.mjs`. Se outro teste quebrar ou aparecer erro correlato, corrigir e re-testar autonomamente até aprovação completa.
6. **Explicar:** Descrever de forma concisa a causa raiz, a correção e o que foi sanado na auto-cura.

---

## [WF-04] Alteração de Banco de Dados
1. **Leitura:** Ler `docs/DATABASE.md` na íntegra.
2. **Proposta:** Descrever a alteração (nova tabela, coluna, constraint ou índice).
3. **Impacto:** Explicar o impacto sobre dados existentes e performance.
4. **Aprovação:** Aguardar autorização humana se envolver migration estrutural.
5. **Migration:** Criar migration numerada em `harness/scripts/migrations/`.
6. **Testes:** Rodar testes para garantir que a camada de repositório continua íntegra.
7. **Documentar:** Atualizar `docs/DATABASE.md` com as novas tabelas/colunas.

