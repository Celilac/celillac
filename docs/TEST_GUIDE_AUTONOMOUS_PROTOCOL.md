# Roteiro de Teste do Protocolo de Autonomia e Subagente de Navegador

Este guia descreve o passo a passo para testar a pirâmide de testes autônoma, o **Subagente de Navegador (`browser_subagent`)** e o **Ciclo de Auto-Cura (Self-Healing Loop)** na sua máquina pessoal (sem bloqueios de firewall corporativo).

---

## 🎯 Objetivos do Teste

1. **Liberdade de Conexão:** Confirmar que na máquina pessoal o IDE Antigravity consegue baixar o driver Playwright sem erro de CDN/firewall.
2. **Navegação Autônoma:** Testar o `browser_subagent` inspecionando o Web-App local (`http://localhost:3001`), interagindo com páginas e checando erros de console.
3. **Smoke Tests e Orquestrador:** Validar os scripts `scripts/agent-verify.mjs` e `scripts/test-api-smoke.mjs`.
4. **Desafio de Auto-Cura:** Simular um erro e comprovar que o Agente diagnostica, corrige e re-testa autonomamente sem parar para pedir ajuda.

---

## 🚀 Passo 1: Preparação do Ambiente Local

No terminal da máquina pessoal:

```powershell
# 1. Puxe a branch atualizada
git checkout feat/autonomous-test-protocol
git pull origin feat/autonomous-test-protocol

# 2. Suba o banco de dados PostgreSQL
docker-compose up -d

# 3. Em um terminal, inicie o Backend (Porta 3000)
cd backend
npm run dev

# 4. Em outro terminal, inicie o Frontend Web-App (Porta 3001)
cd frontend/web-app
npm run dev
```

---

## 🧪 Passo 2: Teste da Bateria Rápida via CLI

Abra um terceiro terminal na raiz do projeto e execute:

```bash
# Executa a pirâmide completa (TypeScript Backend + 87 Jest + Paridade + TypeScript Frontend + Smoke Tests)
npm run verify

# Ou teste diretamente os endpoints da API viva
npm run test:smoke
```

**Resultado Esperado:**  
Todos os testes devem retornar `✔ [PASS]` com `✨ SUCESSO TOTAL` e código de saída 0.

---

## 🌐 Passo 3: Teste do Subagente de Navegador (`browser_subagent`)

No chat do Antigravity IDE, envie o seguinte comando para o Agente:

> *"Valide a integridade visual da página inicial e da listagem de estabelecimentos em http://localhost:3001 usando o subagente de navegador. Verifique se há erros no console."*

**O que vai acontecer:**
1. O IDE Antigravity fará o download do binário do Playwright (que será concluído com sucesso por não ter proxy corporativo bloqueando).
2. O subagente abrirá uma instância do navegador, navegará até `http://localhost:3001` e depois para `/public-partners`.
3. O subagente verificará o DOM, confirmará a ausência de telas vermelhas do Next.js e gerará uma gravação/screenshot do fluxo na pasta de artefatos.

---

## 🔄 Passo 4: O Teste de Fogo da Auto-Cura ("Achou um bug? Resolva.")

Para comprovar que a diretriz de auto-cura funciona na prática:

1. **Induza um erro de propósito:**  
   Abra `backend/src/domain/catalog/Product.ts` e insira uma quebra proposital de sintaxe ou tipo (exemplo: mude `name: string` para `name: number;` no construtor).
2. **Chame o Agente no chat com a instrução:**  
   > *"Execute a esteira de verificação autônoma. Encontrou um problema? Corriga. Achou um bug? Resolva."*
3. **Comportamento Esperado do Agente:**
   - O Agente rodará `node scripts/agent-verify.mjs`.
   - O compilador TypeScript acusará o erro no `Product.ts`.
   - **O Agente NÃO vai parar para perguntar o que fazer.**
   - O Agente abrirá o arquivo afetado, reverterá/corrigirá a tipagem cirurgicamente.
   - O Agente rodará novamente `node scripts/agent-verify.mjs` até atingir 100% verde.
   - O Agente apresentará o relatório final comprovando a resolução autônoma do incidente.
