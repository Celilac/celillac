@../../AGENTS.md

# Mobile App (Flutter)

Este diretório é o app móvel do CeLiLac, escrito em Flutter/Dart.

## Regras específicas deste app

- **Camada de API única:** toda chamada HTTP passa por `lib/api/api_client.dart`.
  Nunca chame o backend diretamente de uma tela/widget.
- **Nunca calcule compatibilidade alimentar localmente.** `AlertBanner` e
  `RestrictionChip` só recebem campos já decididos pelo backend (`riskLevel`,
  `reasoning`, `allergen`, `severity`) — nunca `hasGluten`/`crossContamination`
  brutos. Ver `../../docs/FRONTEND_STRATEGY.md`.
- **JWT nunca em armazenamento não criptografado.** Use sempre
  `lib/core/storage/secure_token_storage.dart` (Keychain/Keystore via
  `flutter_secure_storage`).
- **Estado global:** `SessionController` (`lib/core/auth/session_controller.dart`)
  é a única fonte de verdade para sessão/auth e para o gate de onboarding
  (`hasFoodProfile`). Não duplique esse estado em telas individuais.
- Antes de mudanças relevantes, rode `flutter analyze` e `flutter test`.
