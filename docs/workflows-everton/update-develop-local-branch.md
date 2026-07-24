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

```bash
# 3.1. Para e remove os containers e redes atuais (preserva os volumes)
docker compose down

# 3.2. Levanta os containers novamente, forçando o build de imagens locais e a recriação do zero
docker compose up -d --build --force-recreate
```
