# Catálogo e Gestão de Parceiros Comerciais (Partners)

**Status:** ✅ Implementado
**Entregue em:** 2026-07-17, atualizado em 2026-10-20 (FEAT-112: Suporte Formal a Pessoa Física/PF e Pessoa Jurídica/PJ, Value Object Cpf, Documentação e Validação Reativa de Formulários - ver [CHANGELOG.md](../../CHANGELOG.md))
**Contrato completo:** [`docs/API_CONTRACTS.md`](../API_CONTRACTS.md#7-gestão-de-parceiros-partners)
**Regras de domínio:** [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md)

## Endpoints

| Método | Rota | Descrição |
|:-------|:-----|:----------|
| `POST` | `/partners` | Cadastrar novo estabelecimento comercial PJ ou PF (suporta `legalNature`, `documentNumber`, `documentUrl`, `companyName`, `responsibleName`, `logoUrl`) |
| `GET`  | `/partners` | Listagem pública de estabelecimentos homologados e ativos |
| `GET`  | `/partners/:id` | Detalhes de um estabelecimento específico |
| `GET`  | `/partners/me/all` | Listar todos os estabelecimentos do usuário parceiro autenticado |
| `PUT`  | `/partners/:id` | Atualizar dados do estabelecimento (suporta alteração de documento, alvará e dados PJ/PF) |
| `POST` | `/partners/:id/submit` | Submeter estabelecimento para revisão administrativa |
| `PATCH`| `/partners/:id/operational-status` | Alternar status operacional (`ACTIVE`, `TEMPORARILY_CLOSED`, `INACTIVE`) |
| `GET`  | `/admin/partners` | Listar estabelecimentos para moderação administrativa |
| `POST` | `/admin/partners/:id/approve` | Aprovar cadastro de parceiro |
| `POST` | `/admin/partners/:id/reject` | Rejeitar cadastro com justificativa |
| `POST` | `/admin/partners/:id/suspend` | Suspender parceiro com justificativa |
| `POST` | `/admin/partners/:id/reactivate` | Reativar parceiro suspenso |

## Domínio

- `Partner` (Entidade raiz do Bounded Context de Catálogo de Parceiros)
- `Cnpj` Value Object (Validação algorítmica Módulo 11 da Receita Federal, formatação e suporte a opcionalidade)
- `Cpf` Value Object (Validação algorítmica Módulo 11 da Receita Federal, formatação para produtores Pessoa Física)
- `legalNature`: `'PJ'` | `'PF'` (Natureza jurídica do parceiro comercial)
- `documentType`: `'CNPJ'` | `'CPF'` (Tipo de documento fiscal ou pessoal)
- `documentUrl`: Link/URI de documento comprobatório (alvará sanitário para PJ / documento oficial com foto para PF)
- `companyName`: Razão Social (PJ)
- `responsibleName`: Nome do Produtor / Responsável Legal (PF)
- `PartnerType`: `RESTAURANT` | `MARKET` | `INDEPENDENT_PRODUCER`
- `PartnerApprovalStatus`: `DRAFT` | `PENDING_REVIEW` | `APPROVED` | `REJECTED` | `SUSPENDED`
- `PartnerOperationalStatus`: `ACTIVE` | `INACTIVE` | `TEMPORARILY_CLOSED`
- `logoUrl`: Identidade visual / Marca do estabelecimento (otimizada em WebP/JPEG, preservada com `contain`)
- `phone`: Padrão internacional E.164 (`+55...`, `+1...`, `+351...`)
- `address`: Endereço integrado com auto-completar via CEP (ViaCEP) e mapa interativo (Google Maps)

**Regras críticas:**
- Ao finalizar o cadastro completo de um estabelecimento (`POST /partners`), o parceiro é submetido automaticamente para análise com o status `PENDING_REVIEW`. O status `DRAFT` é mantido apenas quando `isDraft: true` for explicitamente solicitado.
- Para PJ, `companyName` (Razão Social) e CNPJ válido (Módulo 11) são obrigatórios, acompanhados de upload do Alvará Sanitário / Licença.
- Para PF, `responsibleName` (Nome do Produtor) e CPF válido (Módulo 11) são obrigatórios, acompanhados de upload de documento de identificação com foto.
- No frontend, o botão `[Cadastrar Estabelecimento]` permanece rigidamente desabilitado enquanto os campos obrigatórios não estiverem completamente preenchidos e válidos.
- Alterações em campos críticos (`name`, `type`, `cnpj`, `documentNumber`, `address`, `phone`, `city`, `state`) em estabelecimentos aprovados regridem o status para `PENDING_REVIEW`.
- Alterações em `description` e `logoUrl` são não-críticas e preservam o status `APPROVED`.
- Parceiros suspensos não podem ter seu status operacional alterado antes da reativação.
- Estabelecimentos só aparecem na listagem pública quando aprovados pela governança e não suspensos.

## Testes

- `backend/tests/unit/domain/partner/Cnpj.spec.ts`
- `backend/tests/unit/domain/partner/Cpf.spec.ts`
- `backend/tests/unit/domain/partner/Partner.spec.ts`
- `backend/tests/unit/application/partner/RegisterPartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/UpdatePartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/GetPartnerUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListUserPartnersUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListPublicPartnersUseCase.spec.ts`
- `backend/tests/unit/application/partner/ListAdminPartnersUseCase.spec.ts`
