# PLAN.md - Melhorias no Cadastro e Gestão de Parceiros: Telefone Internacional, CEP Automático, Google Maps e Validação Oficial de CNPJ

**Branch de Trabalho:** `feat/product-registration-redesign`  
**Status:** Aguardando Aprovação Humana

---

## 1. Objetivo
Implementar melhorias essenciais de usabilidade, internacionalização, conformidade fiscal e geolocalização no ecossistema de parceiros comerciais (`Partner`):
1. **Telefone Internacional:** Máscara dinâmica por país, suporte a múltiplos DDIs (Brasil 🇧🇷, EUA 🇺🇸, Portugal 🇵🇹, etc.) e armazenamento no formato internacional E.164.
2. **Endereço & CEP:** Consulta automática de CEP via ViaCEP (gratuito) para endereços no Brasil com auto-preenchimento e fallback manual; suporte a Código Postal para endereços internacionais.
3. **Google Maps:** Integração de mapa interativo (Google Maps Embed `output=embed` com zero custos e sem dependência de API key paga) no cadastro/edição, no catálogo público e no painel administrativo com botão "Como Chegar".
4. **CNPJ com Máscara e Validação Oficial:** Máscara em tempo real `99.999.999/9999-99` no frontend e validação algorítmica rigorosa (Módulo 11 da Receita Federal) no domínio com o Value Object `Cnpj`.

---

## 2. Escopo Detalhado

### 2.1 Domínio e Backend (`backend`)
- **Value Object `Cnpj` (`backend/src/domain/partner/value-objects/Cnpj.ts`):**
  - Implementação do algoritmo oficial do Módulo 11 (cálculo de 1º e 2º dígitos verificadores com pesos 5..2, 9..2 e 6..2, 9..2).
  - Bloqueio de sequências repetidas (`00000000000000`, etc.).
  - Preservação da opcionalidade para produtores artesanais/pessoa física.
- **Entidade `Partner` (`backend/src/domain/partner/Partner.ts`):**
  - Validação via `Cnpj.create()` nos métodos `create` e `updateDetails`.
  - Suporte a telefones internacionais no formato E.164.
- **Suíte de Testes Unitários:**
  - `Cnpj.spec.ts` com cobertura de 100% de casos válidos e inválidos.
  - Atualização dos testes existentes de `Partner.spec.ts`.

### 2.2 Frontend Web App (`frontend/web-app`)
- **Utilitários de Máscara e Validação (`src/utils/mask.ts`):**
  - `maskCnpj`, `validateCnpj`, `maskCep`, `maskPhone`, `parsePhoneToE164`.
- **Serviço de CEP (`src/services/viaCep.ts`):**
  - Consulta assíncrona ao ViaCEP com preenchimento automático de Logradouro, Bairro, Cidade e Estado.
- **Componente `InternationalPhoneInput.tsx`:**
  - Seletor de DDI/País com bandeiras e máscara adaptativa.
- **Componente `PartnerLocationMap.tsx`:**
  - Renderização responsiva do Google Maps Embed com pino e botão "Como Chegar / Abrir no Google Maps".
- **Telas de Cadastro e Edição (`/partner/register` e `/partner/[id]/edit`):**
  - Integração do input de telefone internacional, busca por CEP, campos de número/complemento, validação visual de CNPJ e mapa de preview ao vivo.
- **Páginas de Visualização (`/public-partners/[id]`, `/partner/[id]`, `/admin/partners`):**
  - Exibição de mapa de localização e telefone formatado com atalho para WhatsApp e chamada.

---

## 3. Matriz de Testes e Validação
- Testes unitários Jest: `npm test` no backend (todas as suítes verdes).
- Build estático Next.js: `npm run build` no frontend (19/19 rotas com zero erros).
- Validação manual de CEP real (`01310-100`), CNPJs válidos e inválidos, telefones de diferentes países e renderização do mapa.
