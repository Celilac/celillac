# Workflow: PR Detalhado com Revisor Fixo e Retorno Local para Main

Este workflow define como abrir PRs com descrição detalhada, sempre marcando `thevingance` como revisor, e como finalizar o trabalho localmente após o PR sem atualizar a `main` com o remoto.

## Regras Obrigatórias
1. Todo PR deve marcar `thevingance` como revisor.
2. Todo PR deve ser detalhado para ajudar o avaliador a entender com clareza:
   - objetivo da mudança;
   - contexto do problema;
   - o que foi alterado;
   - impactos esperados;
   - validações executadas;
   - riscos conhecidos e pontos de atenção.
3. Após a criação do PR, a branch de trabalho deve deixar de existir localmente.
4. Tudo o que foi feito na branch deve permanecer integrado na `main` local.
5. Este workflow **não** deve atualizar a `main` a partir do remoto. Não usar `git fetch`, `git pull` ou rebase com branch remota como parte deste fluxo.

---

## Estrutura Recomendada do PR

Use uma descrição completa, preferencialmente com esta estrutura:

```md
## Objetivo
- O que esta entrega resolve.

## Contexto
- Qual problema motivou a alteração.
- Qual comportamento anterior era insuficiente.

## O que foi feito
- Principais alterações de código.
- Ajustes de fluxo, validação, UI, contratos ou documentação.

## Validação
- Testes executados.
- Builds executados.
- Verificações manuais realizadas.

## Riscos e atenção do review
- Pontos sensíveis.
- Limitações conhecidas.
- O que merece revisão mais cuidadosa.
```

---

## Passo a Passo

### Passo 1: Confirmar branch atual
Verifique qual é a branch de trabalho ativa.

```bash
git branch --show-current
```

> [!IMPORTANT]
> Este fluxo pressupõe que você está em uma branch de trabalho já commitada e pronta para PR.

### Passo 2: Validar alterações antes do PR
Execute as validações pertinentes ao escopo da mudança antes de abrir o PR.

Exemplos:

```bash
npm test
npm run build
npm run lint
```

### Passo 3: Criar o PR com descrição detalhada
Ao criar o PR, inclua uma descrição detalhada e marque `thevingance` como reviewer.

Exemplo com GitHub CLI:

```bash
gh pr create \
  --title "<titulo-claro-do-pr>" \
  --body-file <arquivo-com-descricao-detalhada.md> \
  --reviewer thevingance
```

Se preferir enviar a descrição inline:

```bash
gh pr create \
  --title "<titulo-claro-do-pr>" \
  --body "<descricao-detalhada>" \
  --reviewer thevingance
```

> [!IMPORTANT]
> A descrição do PR não deve ser curta ou genérica. O reviewer deve conseguir entender a entrega sem precisar reconstruir o contexto manualmente.

### Passo 4: Voltar para a `main` local
Depois de abrir o PR, retorne para a `main` local.

```bash
git checkout main
```

### Passo 5: Integrar localmente a branch na `main`
Mescle localmente a branch de trabalho na `main`, preservando tudo o que foi feito localmente.

```bash
git merge <branch-de-trabalho>
```

> [!IMPORTANT]
> Não atualizar a `main` com remoto antes desse merge. A `main` aqui deve refletir apenas o estado local somado ao trabalho concluído na branch.

### Passo 6: Remover a branch local
Após o merge local na `main`, remova a branch local que originou o PR.

```bash
git branch -d <branch-de-trabalho>
```

Se o Git impedir por divergência de histórico local conhecida e intencional:

```bash
git branch -D <branch-de-trabalho>
```

### Passo 7: Confirmar estado final local
Ao final, confirme que:
- você está na `main` local;
- a branch de trabalho não existe mais localmente;
- o conteúdo dela está preservado na `main` local.

```bash
git branch --show-current
git branch
git status
```

---

## Resultado Esperado
Ao fim deste workflow:
1. O PR foi criado com descrição detalhada.
2. `thevingance` foi marcado como reviewer.
3. A branch de trabalho não existe mais localmente.
4. A `main` local contém tudo o que existia na branch.
5. Nenhuma atualização com o remoto foi feita durante o processo.