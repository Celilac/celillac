# PLAN.md - Fase 4: Integração com AllergenEngine & Verificação de Laudos/Selos

**Referência:** `PRDs/Feedback_Cadastro_Produtos_CeliLac.md` (Seções 3, 4, 6, 9 e 10)  
**Branch de Trabalho:** `feat/product-registration-redesign`  
**Status:** Aguardando Aprovação Humana

---

## 1. Objetivo da Fase 4
Integrar as informações estruturadas cadastradas nas fases anteriores (Matriz de 10 Alérgenos RDC 727, Isolamento de Contaminação Cruzada, Estilos de Vida e Selos Técnicos) diretamente ao **`AllergenEngine`** (Motor de Compatibilidade Alimentar) e implementar o **Módulo de Moderação e Auditoria de Laudos/Selos Técnicos** para a equipe administrativa do CeLiLac.

---

## 2. Escopo Detalhado

### 2.1 Motor de Compatibilidade (`AllergenEngine`)
- **Evolução do `ProductSnapshot`:** Incorporação de `declaredAllergens`, `crossContaminationDetails`, `certifications` ativas e `informationOrigin`.
- **Preservação de Invariantes Biológicas:**
  - R1: Produto sem ingredientes continua incondicionalmente `BLOCKED`.
  - R2: Perfil inativo/incompleto continua `UNEVALUATED`.
  - R3/R4: Restrição `FATAL` (ex: Doença Celíaca) bloqueia com glúten em ingredientes, glúten declarado (`CONTAINS`), traços declarados (`TRACES`), ou ambiente compartilhado sem protocolo de isolamento.
- **Detecção de Divergência:** Se o parceiro declarou `FREE`, mas ingredientes contêm o alérgeno, o ingrediente prevalece e é gerado um alerta crítico de divergência.
- **Transparência na Análise:** O `CompatibilityReport` passa a decompor a conclusão do CeLiLac, a declaração do parceiro e o nível de confiança auditada (`AUDITED_BY_CELILAC`, `PARTNER_DECLARED`).

### 2.2 Governança e Moderação de Certificações (Admin)
- **Repositório:** `PgProductCertificationRepository` para consultas com filtros (`PENDING`, `VERIFIED`, `REJECTED`) e atualização de status.
- **Casos de Uso Admin:**
  - `ListAdminCertificationsUseCase`: Lista paginada de certificações pendentes com dados do produto, parceiro e foto do laudo.
  - `ReviewProductCertificationUseCase`: Homologa ou Rejeita o laudo técnico com parecer e registro imutável em `audit_logs`.
- **Rotas HTTP:** `GET /admin/certifications` e `PATCH /admin/certifications/:id/review` protegidas por `adminOnlyMiddleware`.
- **Painel Administrativo Web:** Tela `/admin/certifications` com visualização em alta resolução da foto do laudo (lightbox), dados cadastrais do selo, indicadores de validade e modais de confirmação.
- **Visualização do Consumidor:** Badges visuais no `RiskBadge` refletindo comprovação técnica auditada pelo CeLiLac.

---

## 3. Plano de Arquivos e Modificações

| Camada | Arquivo | Ação |
| :--- | :--- | :--- |
| **Domínio (Engine)** | `backend/src/domain/allergen-engine/ProductSnapshot.ts` | [MODIFY] Novos campos da matriz e certificações |
| **Domínio (Engine)** | `backend/src/domain/allergen-engine/CompatibilityReport.ts` | [MODIFY] Relatório multidimensional com confiança |
| **Domínio (Engine)** | `backend/src/domain/allergen-engine/AllergenEngine.ts` | [MODIFY] Avaliação da matriz, divergências e ambiente |
| **Domínio (Catálogo)** | `backend/src/domain/catalog/repositories/IProductCertificationRepository.ts` | [NEW] Interface do repositório de certificações |
| **Infraestrutura** | `backend/src/application/catalog/mappers/toProductSnapshot.ts` | [MODIFY] Mapeamento de matriz e certificações |
| **Infraestrutura** | `backend/src/infrastructure/database/product/PgProductRepository.ts` | [MODIFY] JOIN de certificações e dados estruturados |
| **Infraestrutura** | `backend/src/infrastructure/database/catalog/PgProductCertificationRepository.ts` | [NEW] Implementação do repositório de certificações |
| **Casos de Uso Admin** | `backend/src/application/admin/certifications/ListAdminCertificationsUseCase.ts` | [NEW] Listagem para moderação |
| **Casos de Uso Admin** | `backend/src/application/admin/certifications/ReviewProductCertificationUseCase.ts` | [NEW] Homologação e auditoria de laudos |
| **Controllers Admin** | `backend/src/interfaces/http/controllers/admin/AdminCertificationController.ts` | [NEW] Controller de moderação |
| **Rotas Admin** | `backend/src/interfaces/http/routes/admin.routes.ts` | [MODIFY] Registro das novas rotas de certificação |
| **Testes Backend** | `backend/tests/unit/domain/allergen-engine/AllergenEngine.spec.ts` | [MODIFY] Casos de teste da matriz e divergências |
| **Testes Backend** | `backend/tests/unit/application/admin/ReviewProductCertificationUseCase.spec.ts` | [NEW] Testes unitários do caso de uso de moderação |
| **Frontend API** | `frontend/web-app/src/api/certifications.ts` | [NEW] Cliente HTTP de certificações |
| **Frontend Admin** | `frontend/web-app/src/app/admin/certifications/page.tsx` | [NEW] Painel administrativo de moderação |
| **Frontend Layout** | `frontend/web-app/src/components/layout/Header.tsx` | [MODIFY] Link para "🏅 Selos & Laudos" no menu Admin |
| **Frontend UI** | `frontend/web-app/src/components/common/RiskBadge.tsx` | [MODIFY] Selo auditado e alertas de divergência |

---

## 4. Guardrails e Critérios de Aceite
- [ ] Invariantes biológicas R1 a R9 estritamente preservadas.
- [ ] Detecção e alerta explícito de divergência entre ingredientes e declaração "Livre".
- [ ] 100% de rastreabilidade de homologação/rejeição de laudos em `audit_logs`.
- [ ] Proteção estrita RBAC em `/admin/certifications` (HTTP 403 para não-administradores).
- [ ] Suíte de testes unitários passando no backend (`npm test`).
- [ ] Build concluído com sucesso no backend (`tsc`) e frontend (`next build`).
