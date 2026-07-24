# Workflow: Sincronização da Branch Develop (sync-develop.md)

Este workflow descreve apenas o processo de sincronização da branch local `develop` com as alterações mais recentes do repositório remoto (`origin/develop`).

> [!IMPORTANT]
> Se o objetivo for abrir um PR, marcar `thevingance` como reviewer, detalhar a descrição do PR e depois retornar para a `develop` local sem atualizar com remoto, **não use este arquivo**.
> Nesse caso, use o workflow [pr-local-develop.md](pr-local-develop.md).

> [!IMPORTANT]
> A branch `main` está congelada: nenhum trabalho, merge ou sincronização deve ser feito nela a partir de agora. Todo o desenvolvimento acontece em `develop` (ou em feature branches que nascem dela).

## Objetivos
1. Atualizar a branch `develop` local com o estado do repositório remoto (`remote`).
2. Preservar alterações locais temporárias enquanto a sincronização remota é executada.

---

## Passo a Passo

### Passo 1: Salvar trabalho temporário (opcional)
Se você tiver alterações não commitadas na sua branch de desenvolvimento atual, guarde-as no stash para evitar conflitos de arquivos e garantir uma transição limpa entre branches:
```bash
# Verifica se há alterações pendentes
git status

# Salva alterações não commitadas no stash
git stash
```

### Passo 2: Identificar a branch de desenvolvimento atual
Identifique e anote o nome da sua branch de desenvolvimento atual.
```bash
# Exibe a branch ativa
git branch --show-current
```

### Passo 3: Atualizar a branch Develop local com o Remote
Navegue até a branch `develop` e puxe as alterações mais recentes do servidor remoto.
```bash
# Mudar para a branch develop
git checkout develop

# Buscar as novidades do remote
git fetch origin

# Atualizar a develop local com o que está no remote
git pull origin develop
```

### Passo 4: Retornar à Branch de Desenvolvimento (Opcional)
Se você deseja continuar desenvolvendo na sua branch de origem após a sincronização remota da `develop`:
```bash
# Volta para a branch de desenvolvimento original
git checkout <sua-branch-dev>

# Opcional: atualizar sua branch de desenvolvimento com a develop recém-atualizada
git merge develop

# Se você usou o git stash no Passo 1, recupere o seu trabalho temporário
git stash pop
```
