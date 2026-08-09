# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

This monorepo spans three surfaces sharing one backend: `frontend/web-app` and `frontend/landing-page` (Next.js 14, web) and `frontend/mobile-app` (Flutter, native iOS/Android — Material and/or Cupertino per platform). This root PRODUCT.md holds the truth shared across all three. `frontend/mobile-app` should get its own child PRODUCT.md scoped to native specifics when mobile design work starts; confirm shared-vs-app-specific scope before writing it, per this file's guidance.

## Users

- **Shiderlene — Celiac consumer** (primary, mobile-app). Diagnosed celiac, has been hospitalized from cross-contamination in a product labeled "gluten-free." Doesn't trust label claims alone. Uses the app in the field — scanning or searching products while shopping — to get an immediate, trustworthy verdict before buying.
- **Carlos — Partner (restaurant/product owner)** (web-app). Wants a verifiable, transparent way to prove his gluten-free offerings are safe. Registers products with full ingredient lists and cross-contamination data via a partner panel.
- **Lara — Admin/curator** (web-app). Responsible for catalog data quality. Reviews and resolves user reports about incorrect product information; bad data here creates real health risk.

## Product Purpose

CeLiLac protects the health of celiacs and people with food restrictions by providing reliable product-safety information — specifically **cross-contamination**, which doesn't appear in a product's main ingredient list but can cause serious reactions. Success is a consumer trusting a verdict enough to act on it before consuming a product, and a catalog whose data quality is maintained through partner input, community review, and admin moderation.

## Positioning

A "gluten-free" label alone is not proof of safety — cross-contamination during manufacturing or handling is invisible on the label and no accessible platform today consolidates that risk with community validation. CeLiLac's mechanism: a single backend `AllergenEngine` (pure domain logic, no exceptions) is the only source of truth for compatibility, cross-referencing a user's food profile (allergen + severity) against a product's full ingredient and cross-contamination data to emit one of four verdicts: `SAFE` / `WARNING` / `DANGER` / `BLOCKED`, backed by community reviews and a moderated reporting flow.

## Operating Context

- **Field use (mobile):** Shiderlene uses the scanner (EAN-13/EAN-8 barcode) or search while physically shopping or about to eat — fast, one-handed, high-stakes moments.
- **Desk use (web):** Carlos and Lara work through browser-based panels — product registration and moderation queues, not time-critical in the same way.
- **Three user roles:** `CELIACO`, `PARCEIRO`, `ADMIN`, enforced via JWT (7-day validity).
- **Verdict pipeline:** food profile → `POST /compatibility/check` → `AllergenEngine` (backend-only) → `{ riskLevel, conflicts[], reasoning }` → presentation layer renders, never recalculates.
- Full contracts, personas, and journeys are already recorded in `docs/PRD.md`, `docs/API_CONTRACTS.md`, `docs/DOMAIN_MODEL.md`, and `PRDs/*.md` — treat those as living sources of truth alongside this file, not superseded by it.

## Capabilities and Constraints

- **Compatibility calculation happens exclusively in the backend `AllergenEngine`.** Frontend and mobile are presentation-only; duplicating risk logic client-side is an explicit, hard-banned failure mode (`docs/FRONTEND_STRATEGY.md`).
- Product without ingredients → `BLOCKED` by default (precautionary principle), never silently `SAFE`.
- `BLOCKED` can never be displayed as `SAFE` by any layer.
- Mobile JWT stored in Keychain (iOS) / Keystore (Android) via `flutter_secure_storage`, never AsyncStorage. Web JWT stored in `sessionStorage`/memory, never `localStorage`.
- Food-profile restriction changes at `FATAL` severity must trigger a history-revalidation warning.
- `cross_contamination` is a required field on product registration.
- Any change to the `AllergenEngine` requires human approval and a regression test suite — this is a standing constraint on any design or implementation work touching risk verdicts.

## Brand Commitments

- Single source of truth for the logo: `frontend/web-app/public/brand/logo_with_transparent_background.png` (highest-res, alpha) — reused for every new web or mobile placement.
- Mobile brand asset is a registered copy at `frontend/mobile-app/assets/brand/logo.png`; all generated app icons/splash screens (Android mipmaps, iOS AppIcon set, launch images) derive from it. Use the `BrandLogo` widget (`lib/shared/widgets/brand_logo.dart`) rather than emoji or bare text.
- Never reintroduce Flutter's default placeholder assets (blue "F" icon) or emoji as a logo substitute.
- Risk-verdict color convention is already fixed and must be preserved, not redesigned: `SAFE` (green), `WARNING` (yellow), `DANGER` (orange), `BLOCKED` (red, maximum visual emphasis).

## Evidence on Hand

- Detailed personas, journeys, and functional/non-functional requirements: `docs/PRD.md`.
- Deeper consumer and partner research: `PRDs/Análise do Consumidor no CeliLac.md`, `PRDs/Análise de Partner no CeliLac.md`.
- No real customer testimonials, case studies, press, or production usage data exist yet — do not fabricate any in future design work; the three PRD personas (Shiderlene, Carlos, Lara) are the confirmed stand-ins for real user evidence.

## Product Principles

1. **The backend is the only source of safety truth.** No interface may calculate, infer, or override a risk verdict — only display it.
2. **When in doubt, block.** Missing data defaults to the most cautious verdict, never the most permissive.
3. **Speed matters most where the stakes are highest.** The mobile scanning/checking flow is the core life-safety moment and should be optimized for fast, in-the-aisle use over the web panels' more deliberate data-entry flows.
4. **Trust is built two ways:** partner-verified data (Carlos) and community/admin moderation (Lara's reports pipeline) both feed the same catalog quality bar.
5. **Never regress the risk-verdict color convention** or weaken the visibility of `BLOCKED`/`DANGER` states in pursuit of aesthetics.

## Accessibility & Inclusion

- **WCAG 2.1 AA** is the target standard across web and mobile surfaces.
- **Risk verdicts must never rely on color alone.** `SAFE`/`WARNING`/`DANGER`/`BLOCKED` always pair color with icon and text label — critical because a color-blind user misreading a life-safety signal is a real-world harm this product exists to prevent.
