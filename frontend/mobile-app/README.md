# CeLiLac Mobile (Flutter)

App móvel do CeLiLac — segurança alimentar para celíacos, com foco em detecção
de contaminação cruzada. Ferramenta de campo para uso durante compras/refeições:
scanner de código de barras, busca de produtos e verificação de compatibilidade
alimentar contra o perfil do usuário.

> Regra de arquitetura crítica: este app **nunca** calcula compatibilidade
> alimentar localmente. Toda decisão de segurança vem de `POST /compatibility/check`
> no backend (`AllergenEngine`). Ver `../../docs/FRONTEND_STRATEGY.md`.

## Stack

- Flutter (Dart), Material 3, tema escuro único (`lib/core/theme`)
- Estado: `provider` + `ChangeNotifier` (sessão de auth em `SessionController`)
- HTTP: `http` — camada única em `lib/api/`
- Armazenamento seguro do JWT: `flutter_secure_storage` (Keychain/Keystore)
- Scanner de código de barras/QR: `mobile_scanner`

## Rodando localmente

```bash
flutter pub get
flutter run -d <device>
```

O backend precisa estar rodando localmente (`cd ../../backend && npm run dev`,
ou `docker-compose up` na raiz do repo). A URL base é resolvida por
plataforma em `lib/api/api_client.dart` (emulador Android usa `10.0.2.2`,
simulador iOS usa `localhost`) — ajuste a porta lá se seu `backend/.env`
usar uma porta diferente da configurada.

## Testes

```bash
flutter analyze
flutter test
```
