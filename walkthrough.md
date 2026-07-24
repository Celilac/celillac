# Walkthrough - Implementação de Logout & Invalidação de Tokens (Blacklist)

Este documento descreve as alterações, os testes e os resultados finais da funcionalidade de logout e expiração segura de tokens no ecossistema **CeLiLac**.

---

## 🛠️ O que foi feito

### 1. Persistência de Tokens (Banco de Dados)
*   **Migration SQL:** Criada a migration `010_create_blacklisted_tokens_table.sql` em `harness/scripts/migrations/` para persistir os tokens revogados e o tempo em que devem expirar (`expires_at`), com índice no campo de expiração para limpeza otimizada.
*   **Aplicação Local:** A tabela foi criada e indexada com sucesso no container PostgreSQL local `celilac-postgres`.

### 2. Camada de Domínio e Repositórios (Backend)
*   **Interface:** Definida a interface `IBlacklistTokenRepository` especificando os métodos `add` e `isBlacklisted`.
*   **Repositório Concreto:** Criado o `PgBlacklistTokenRepository` mapeando as consultas SQL para a tabela no banco PostgreSQL.

### 3. Casos de Uso e Middlewares (Backend)
*   **Caso de Uso:** Criado o `LogoutUserUseCase` responsável por extrair a data de expiração original do JWT (através do payload decodificado `exp`) e inseri-lo no repositório da blacklist. Conta com fallback robusto de 7 dias caso o token não defina a expiração.
*   **AuthMiddleware:** Modificadas as funções `authMiddleware` e `optionalAuthMiddleware` do Express para serem assíncronas e consultarem a blacklist a cada requisição. Tokens revogados são rejeitados com status `401 Unauthorized (Token revogado.)`.

### 4. Rota HTTP (Backend)
*   **Controlador:** Criado o `LogoutUserController` estendendo `BaseController` para validar a presença do cabeçalho de autorização e delegar a revogação do token ao Use Case.
*   **Rotas:** Registrada a rota `POST /iam/logout` no `iam.routes.ts` com proteção do `authMiddleware`.

### 5. Integração Frontend (Web-App Next.js 14)
*   **API Client:** Adicionado o método `logout` à `iamApi` passando o token JWT atual no cabeçalho.
*   **Contexto de Autenticação:** Atualizado o `AuthContext.tsx` para chamar a API de logout no backend antes de remover as credenciais do `sessionStorage` local (garantindo logout client-side mesmo em caso de falha de conexão).
*   **Interface Visual:**
    *   Adicionado o botão **Sair** no menu superior (Topbar) da página principal (Dashboard).
    *   Adicionado o botão **Sair** no menu superior da página de Perfil (`/profile`), junto com o botão de voltar ao Dashboard.
    *   Condicionado o botão "⚙️ Perfil" na Topbar para aparecer apenas quando o usuário estiver de fato autenticado.
*   **Segurança de Rotas:** Adicionada verificação no mount da página `/profile` para redirecionar usuários não autenticados instantaneamente para `/auth/login`, lendo o `sessionStorage` para evitar falsos redirecionamentos durante a hidratação inicial do Next.js.

---

## 🧪 Qualidade e Validação

### 1. Testes Automatizados (Backend Jest)
*   **LogoutUserUseCase.spec.ts:** Escrita suíte de testes unitários cobrindo o ciclo de vida da blacklist (revogação com expiração correta, fallback seguro de 7 dias e falha sob token ausente).
*   **AuthMiddleware.spec.ts:** Atualizada para rodar com Promises assíncronas de forma segura e adicionado cenário de bloqueio imediato caso o token esteja na blacklist.
*   **Resultados:** Todos os **157 testes** passaram com sucesso!

### 2. Validação E2E no Browser
*   Executado fluxo completo E2E no navegador simulado pelo `browser_subagent` com sucesso absoluto:
    1. Acesso a `/profile` sem estar logado -> redirecionado com sucesso para `/auth/login`.
    2. Login com `celiaco@example.com` -> Redirecionado para a Home e exibidos os botões de Perfil e Sair na Topbar.
    3. Ao clicar no botão **Sair** (tanto no Dashboard `/` quanto no Perfil `/profile`), o usuário é desconectado e redirecionado imediatamente para `/auth/login`, impedindo que qualquer dado residual continue exposto na tela.
    4. Tentativa de acessar `/profile` após o logout -> Bloqueado e redirecionado instantaneamente para `/auth/login` com sucesso.
