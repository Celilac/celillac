# Workflow: Atualização do Ambiente de Desenvolvimento

Este workflow descreve os passos para garantir que sua branch `develop` local contenha **tudo** que você tem localmente e ainda não foi mesclado no remoto, **e também** tudo que já existe no remoto — sem perder nenhuma alteração — além de recriar o ambiente Docker de forma limpa, mantendo os dados da base de dados intactos.

> [!IMPORTANT]
> A branch `main` está congelada: não implementamos, mesclamos nem sincronizamos nada diretamente nela. `develop` é a branch principal de trabalho local a partir de agora.

## 1. Salvar e trazer para a `develop` tudo que ainda não está no remoto

Se você possui alterações não commitadas, ou branches locais com commits que ainda não foram enviados/mesclados no remoto, siga estes passos para trazê-los para a `develop`.

```bash
# 1.1. Verifique o status das suas alterações
git status

# 1.2. Adicione e faça o commit de qualquer alteração pendente na sua branch atual
git add .
git commit -m "chore: salva alterações locais pendentes"

# 1.3. (Opcional) Liste branches locais com commits que ainda não estão na develop
# Ajuda a identificar outros trabalhos locais que também precisam ser trazidos
git branch --no-merged develop

# 1.4. Mude para a branch develop
git checkout develop

# 1.5. Mescle a sua branch de trabalho (e quaisquer outras identificadas no passo 1.3) na develop
# Substitua <nome-da-sua-branch> pelo nome da branch onde você estava trabalhando
git merge <nome-da-sua-branch>
```

*Nota: Repita o passo 1.5 para cada branch local que ainda tenha trabalho não mesclado.*

## 2. Atualizar a `develop` local com as alterações do remoto, sem perder nada

Agora que suas alterações locais estão na `develop`, traga as atualizações mais recentes da `develop` remota. Usamos `merge` (não `rebase`) para garantir que nenhum histórico — local ou remoto — seja reescrito ou descartado.

```bash
# 2.1. Baixa as referências mais recentes do remoto (sem alterar arquivos ainda)
git fetch origin

# 2.2. Mescla o que há em origin/develop na sua develop local
git pull --no-rebase origin develop
```

*Nota: Se houver conflitos de merge durante o `git pull`, resolva-os, adicione os arquivos corrigidos (`git add .`) e conclua o merge (`git commit`) antes de prosseguir para o próximo passo.*

*Nota: Ao final deste passo, sua `develop` local contém tanto o que você tinha localmente (passo 1) quanto tudo que está no remoto — nenhuma alteração é perdida. Se quiser compartilhar suas mesclagens locais com o time, lembre-se de rodar `git push origin develop` separadamente (fora do escopo deste workflow).*

## 3. Recriar o ambiente Docker (preservando o volume de banco de dados)

Para aplicar qualquer nova configuração ou dependência que tenha chegado da branch remota, você deve recriar os containers do Docker Compose.

O comando `down` (sem a flag `-v`) para e remove os containers e redes, mas **mantém os volumes nomeados intactos** (onde os dados do banco de dados geralmente ficam armazenados).

> [!NOTE]
> Autorização permanente: ao executar este workflow, pode rodar o `docker compose down` + `up -d --build --force-recreate` diretamente, sem pedir confirmação antes — mesmo que isso pare containers em execução.

```bash
# 3.1. Para e remove os containers e redes atuais (preserva os volumes)
docker compose down

# 3.2. Levanta os containers novamente, forçando o build de imagens locais e a recriação do zero
docker compose up -d --build --force-recreate
```

## 4. Aplicar migrations pendentes no banco local

> [!IMPORTANT]
> O `docker-compose.yml` só monta scripts de inicialização em `docker-entrypoint-initdb.d`, que o Postgres executa **apenas na primeira vez que o volume é criado**. Como o passo 3 preserva o volume de propósito, qualquer migration nova que tenha chegado da branch remota (via merge/pull do passo 2) **não é aplicada automaticamente** — o schema local fica defasado em silêncio, o que pode gerar erros confusos na aplicação (ex.: uma tabela referenciada pelo backend não existe, mas o erro aparece disfarçado de outra coisa, como token inválido).

Como todas as migrations em `harness/scripts/migrations/` são escritas de forma idempotente (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS` etc.), é seguro reaplicar a sequência inteira a cada execução deste workflow — os objetos já existentes são simplesmente ignorados (com `NOTICE`, sem erro).

> [!NOTE]
> Autorização permanente: ao executar este workflow, pode aplicar as migrations pendentes diretamente contra o container do Postgres, sem pedir confirmação antes.

```bash
# 4.1. Aplica todas as migrations em ordem numérica contra o container do Postgres
# Ajuste container/usuário/banco se o docker-compose.yml tiver sido alterado
cd harness/scripts/migrations
for f in $(ls *.sql | sort); do
  echo "=== Aplicando $f ==="
  docker exec -i celilac-postgres psql -U celilac_user -d celilac_db -v ON_ERROR_STOP=1 < "$f" || { echo "FALHOU em $f — pare e investigue antes de continuar."; break; }
done
cd -
```

*Nota: Se algum arquivo falhar com um erro que não seja "already exists" / "does not exist, skipping", pare e avalie manualmente antes de prosseguir — pode indicar uma migration não idempotente ou um conflito real de schema.*

## 5. Resumir PRs de outros membros da equipe mergeadas no remoto

Depois de atualizar a `develop` local (passo 2), sempre feche o workflow trazendo um resumo dos PRs que **outros integrantes da equipe** mergearam remotamente desde a última atualização — para o usuário avaliar se algo impacta o trabalho em andamento.

```bash
# 5.1. Liste os PRs mergeados recentemente contra develop
gh pr list --base develop --state merged --limit 15 --json number,title,author,mergedAt,url

# 5.2. Para cada PR de outro autor (não o próprio usuário) que entrou no pull do passo 2,
# use `gh pr view <numero> --json title,author,body,files` para detalhar o que muda e por quê
```

Apresente o resumo final agrupado por autor, com número do PR, título e principais mudanças/riscos — focando apenas nos PRs de colegas (não nos do próprio usuário), já que são os que precisam de avaliação.
