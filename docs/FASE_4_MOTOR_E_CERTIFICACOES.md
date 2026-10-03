# Documentação Técnica — Fase 4: Integração com AllergenEngine & Verificação de Laudos/Selos

## 1. Visão Geral
A **Fase 4** conclui a visão estabelecida em [`Feedback_Cadastro_Produtos_CeliLac.md`](../PRDs/Feedback_Cadastro_Produtos_CeliLac.md), integrando a nova Matriz Estruturada de Alérgenos (ANVISA RDC 727/2022) e o Isolamento Fabril ao motor de segurança alimentar [`AllergenEngine.ts`](../backend/src/domain/allergen-engine/AllergenEngine.ts).

Além disso, introduz o fluxo operacional completo de **Moderação e Homologação de Certificações e Laudos Laboratoriais**, permitindo que a equipe do CeLiLac valide laudos de glúten (<20ppm), selos ACELBRA, Vegano e Orgânico, elevando a confiabilidade do produto para `AUDITED_BY_CELILAC`.

---

## 2. Invariantes e Regras de Segurança Alimentar (AllergenEngine)

### 2.1 Regra R10 — Detecção de Divergência Crítica e Prevalência de Ingredientes
- **Cenário:** O estabelecimento declara `FREE` na matriz de alérgenos (ex: "Sem Glúten"), mas a lista de ingredientes textuais do rótulo contém ingredientes conflitantes (ex: "farinha de trigo", "cevada", "aveia").
- **Comportamento do Motor:**
  1. A declaração "FREE" **NUNCA** anula nem mascara os ingredientes detectados.
  2. A presença física do ingrediente prevalece e o risco é calculado normalmente (bloqueando celíacos com `BLOCKED`).
  3. O motor sinaliza `hasDivergence = true` e rebaixa a confiança para `PRECAUTIONARY`.
  4. O motivo do conflito é explicitamente anotado: `[DIVERGÊNCIA CRÍTICA: Declarado livre, porém detectado nos ingredientes ("farinha de trigo")]`.

### 2.2 Avaliação de Risco Ambiental (Contaminação Cruzada de Fábrica)
- Se as instalações possuem `crossContaminationDetails.riskLevel === 'SHARED_FACILITY'` (ou `'SHARED_ENVIRONMENT'`) e o consumidor tem tolerância zero a traços (`severity === FATAL` ou `acceptsCrossContamination === false`):
  - É gerado conflito de contaminação cruzada para alérgenos que não possuam declaração de isolamento exclusivo.
  - Para celíacos, o produto é imediatamente elevado para `BLOCKED` (Regra R4).

### 2.3 Níveis de Confiança (`ConfidenceLevel`)
1. `AUDITED_BY_CELILAC`: Produto compatível com pelo menos um laudo técnico ou selo homologado (`isVerified === true` e vigente dentro da data de `validUntil`).
2. `PARTNER_DECLARED`: Produto compatível baseado estritamente na declaração do rótulo e matriz informada pelo estabelecimento.
3. `PRECAUTIONARY`: Produto onde foram detectadas divergências, falta de ingredientes ou ausência de dados declarados.

---

## 3. Arquitetura do Módulo de Moderação (Admin)

### 3.1 Camadas
```
Admin Frontend (/admin/certifications)
       │
       ▼ (HTTP GET / PATCH com JWT e RBAC)
AdminCertificationController
       │
       ▼
ListAdminCertificationsUseCase / ReviewProductCertificationUseCase
       │
       ├──► IProductCertificationRepository (PgProductCertificationRepository)
       │          └──► PostgreSQL (product_certifications + products + partners + images)
       │
       └──► IAuditLogRepository (PgAuditLogRepository)
                  └──► PostgreSQL (audit_logs - imutável)
```

### 3.2 Endpoints Expostos
- `GET /admin/certifications`: Lista paginada de laudos com filtros por status (`DECLARED_BY_PARTNER`, `VERIFIED_BY_CELILAC`, `REJECTED`).
- `PATCH /admin/certifications/:id/review`: Homologação (`APPROVE`) ou rejeição (`REJECT` com justificativa obrigatória).

---

## 4. Interface do Administrador Web
- **Dashboard Glassmorphism:** Métricas KPI com contagem em tempo real de laudos pendentes, homologados e rejeitados.
- **Visualizador de Laudos (Lightbox):** Inspeção em alta resolução da fotografia do laudo enviada pelo parceiro para conferência de assinaturas, códigos de autenticidade e datas de validade.
- **Gestão de Pílulas:** Filtros segmentados rápidos e barra de busca por produto, marca e entidade certificadora.
- **Badge Auditada para o Consumidor:** Componente [`RiskBadge`](../frontend/web-app/src/components/compatibility/RiskBadge.tsx) exibe a pílula verde `🛡️ Auditado CeLiLac` nos produtos aprovados.
