# Feature: App Mobile (Flutter)

> **Superfície:** App Mobile Native (Flutter / Dart)  
> **Status:** ✅ Implementado  
> **Entregue em:** 2026-07-07 (`FEAT-009`)  
> **Código-fonte:** [`frontend/mobile-app/`](../../frontend/mobile-app/)

---

## 1. Visão Geral

O App Mobile do CeLiLac é a aplicação nativa focada no uso em campo pelo consumidor (ex: supermercados, restaurantes, feiras). Permite a leitura rápida de códigos de barras (EAN-13/EAN-8), busca de produtos, gerenciamento de perfil alimentar e alertas visuais imediatos por nível de risco (`SAFE`, `WARNING`, `DANGER`, `BLOCKED`).

---

## 2. Estrutura da Aplicação Mobile (`frontend/mobile-app`)

| Diretório / Módulo | Responsabilidade |
|:-------------------|:-----------------|
| `lib/api/` | Cliente HTTP para integração com o backend (`ApiClient`, JWT Interceptors) |
| `lib/core/` | Tema, configuração (`config/api_config.dart`), guarda de papel (`auth/consumer_role.dart`) e utilitários |
| `lib/features/auth/` | Telas de Login, Registro e Armazenamento Seguro de JWT (`flutter_secure_storage`) |
| `lib/features/profile/` | Gestão de restrições alimentares e preferências de contaminação cruzada |
| `lib/features/scanner/` | Leitor nativo de código de barras (EAN-13/EAN-8) via câmera |
| `lib/features/catalog/` | Busca de produtos e exibição do relatório de compatibilidade alimentar |
| `lib/shared/widgets/brand_logo.dart` | Widget oficial da marca (`BrandLogo`), utilizando o asset mestre de alta resolução |

---

## 3. Segurança & Guardrails no Mobile

1. **Armazenamento Seguro de Token:** O token JWT é armazenado via `flutter_secure_storage` no Keychain (iOS) e Keystore (Android), nunca em storage não criptografado.
2. **Cálculo de Risco Exclusivo no Backend:** O app mobile **nunca recalcula** o nível de compatibilidade alimentar. Ele consome exclusivamente a resposta do `POST /compatibility/check` emitida pelo `AllergenEngine` do backend.
3. **Identidade de Marca (`BrandLogo`):** Derivada diretamente de `assets/brand/logo.png`, sem reutilizar emojis soltos ou placeholders padrão de template.

---

## 4. Fundação (Etapa 0 — `feat/mobile-consumer-parity`)

### Base URL da API
Resolvida em `ApiConfig` (`lib/core/config/api_config.dart`):

| Cenário | URL |
|:--------|:----|
| `--dart-define=API_BASE_URL=<url>` | O valor informado (espaços e `/` finais removidos) |
| Dev, iOS/desktop (sem define) | `http://localhost:3002` |
| Dev, Android (sem define) | `http://10.0.2.2:3002` |
| Release (sem define) | `https://api.celilac.com.br` |

### Indisponibilidade do backend
Erro de rede (`SocketException`, `ClientException`, timeout) e status `502`/`503` viram `ApiException.serviceUnavailable()`: *"Serviço temporariamente indisponível. O backend está em manutenção ou inicializando."* Login e registro exibem essa mensagem em vez de "senha incorreta".

### Guarda de papel
O app é exclusivo para `CELIACO` (`UserRole`, ver `docs/API_CONTRACTS.md` §9). Após login ou restauração de sessão, qualquer outro papel (`PARCEIRO`, `ADMIN` ou desconhecido) encerra a sessão, **não persiste o token** e exibe a tela "Use o painel web". O papel vem do claim `role` do JWT (apenas decodificado; a validação continua no servidor).

### Navegação
`HomeShell` usa `BottomNavigationBar` com `Icons` do Material; novas abas entram adicionando uma `_HomeTab` à lista.

---

## 5. Conta e conformidade (Etapa 1 — `feat/mobile-account-compliance`)

Sem dependências novas e sem mudanças de backend/JWT. Todas as chamadas passam pelo `ApiClient`; models em `lib/api/models/account_models.dart`.

| Fluxo | Tela | Endpoint | Observações |
|:------|:-----|:---------|:------------|
| Esqueci minha senha (público) | `ForgotPasswordScreen` (link no login) | `POST /iam/password-reset/request` | Sempre exibe a mensagem genérica do backend (anti-enumeração); `429` → mensagem de limite |
| Redefinir senha (público) | `ResetPasswordScreen` | `POST /iam/password-reset/confirm` | E-mail + OTP 6 dígitos + nova senha (regra forte em `core/validation/password_policy.dart`, a mesma do registro); `400` mapeado para "código inválido/expirado" |
| Verificar e-mail (autenticado) | `VerifyEmailScreen` (card **Conta** no Perfil) | `POST /iam/email-verification/verify` e `/resend` | `400 "E-mail já verificado."` encerra o fluxo como sucesso; `429` → mensagem de limite |
| Estado "e-mail verificado" | Card **Conta** no Perfil | `GET /iam/me` → `isEmailVerified` | Não está no JWT. Igual ao web, **não há gate obrigatório**: o fluxo é opcional e não bloqueia o uso |
| Consentimento LGPD Art. 11 | `RegisterScreen` | — | Checkbox obrigatório (texto idêntico ao do web); o botão de cadastro fica desabilitado até marcar |
| Termos de Uso / Privacidade | `TermsScreen`, `PrivacyScreen` | — | Texto estático copiado do web (v1.0), sem alterações; acessíveis do registro e do Perfil |

Regras: OTP e senhas nunca são logados nem persistidos; mensagens técnicas do backend não são exibidas (`AccountErrorMessages` traduz); erros de rede/502/503 usam `ApiException.serviceUnavailable`.

> O texto dos Termos (§4) afirma que a verificação de e-mail é "obrigatória", mas nem o web nem o backend a impõem como gate. Divergência registrada para revisão jurídica — o app mobile não altera o conteúdo.

