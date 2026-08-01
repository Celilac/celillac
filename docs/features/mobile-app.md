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
| `lib/core/` | Temas visuais adaptativos (Dark/Light), constantes e utilitários |
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
