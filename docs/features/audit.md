# Módulo de Auditoria e Rastreabilidade do Domínio (Audit Log)

## 📌 Status
✅ Implementado (Issue #39 & Issue #30)

## 📖 Descrição
Este módulo provê um mecanismo transversal de **auditoria e rastreabilidade de dados sensíveis** do ecossistema CeLiLac em conformidade com a **seção 16.2 do documento de Análise do Consumidor**. Ele mantém um registro histórico imutável (`audit_logs`) de todas as alterações feitas em entidades de domínio críticas, garantindo a reconstrução histórica e governança para:
1. **Perfil Alimentar e Restrições (`FoodProfile`)**: Rastreabilidade completa de acréscimo, remoção ou alteração de severidade de restrições alimentares com snapshots de "antes e depois".
2. **Status do Consumidor (`Consumer`)**: Rastreabilidade de ativação/desativação da conta com registro do administrador responsável e justificativa (Issue #30).
3. **Moderação de Denúncias (`Report`)**: Registro de decisões administrativas e alterações de status de denúncias de segurança alimentar.
4. **Moderação de Parceiros Comerciais (`Partner`)**: Histórico de aprovações, rejeições e suspensões operacionais de estabelecimentos.

## 🔗 Domínio
Regras de negócio conceituais sobre rastreabilidade de dados de saúde e governança estão documentadas em [`docs/DOMAIN_MODEL.md`](../DOMAIN_MODEL.md).

## 🗄️ Esquema do Banco de Dados (`audit_logs`)
Consulte [`docs/DATABASE.md`](../DATABASE.md) e Migration [`017_create_audit_logs.sql`](../../harness/scripts/migrations/017_create_audit_logs.sql).

| Coluna | Tipo | Descrição |
|:-------|:-----|:----------|
| `id` | `UUID` (PK) | Identificador único do log de auditoria. |
| `entity_type` | `VARCHAR(50)` | Tipo da entidade auditada (`FoodProfile`, `Consumer`, `Partner`, `Report`, `User`). |
| `entity_id` | `UUID` | ID da entidade alvo. |
| `action` | `VARCHAR(50)` | Tipo da ação (`UPDATE`, `ACTIVATE`, `DEACTIVATE`, `APPROVE`, `STATUS_CHANGE`). |
| `actor_id` | `UUID` | ID do usuário ou administrador que realizou a ação. |
| `actor_role` | `VARCHAR(50)` | Papel do executor (`CELIACO`, `ADMIN`, `PARCEIRO`, `SYSTEM`). |
| `changes` | `JSONB` | Snapshot detalhado contendo alterações (diferença de antes e depois). |
| `reason` | `TEXT` | Motivo textual da alteração (quando aplicável). |
| `created_at` | `TIMESTAMP` | Carimbo de data/hora imutável do evento. |

## 🏗️ Entidades Principais
- `AuditLog`: Entidade imutável de domínio.
- `IAuditLogRepository`: Interface de contrato do repositório de auditoria.
- `PgAuditLogRepository`: Implementação de persistência PostgreSQL.

## 🛡️ Regras Críticas (Application/Domain)
1. Registros de auditoria são **estritamente imutáveis** e do tipo *append-only* (nunca podem ser alterados ou apagados).
2. Qualquer atualização no perfil alimentar de um consumidor grava automaticamente as restrições anteriores (`oldRestrictions`) e novas (`newRestrictions`) no payload `changes`.
3. Alterações no status de um consumidor gravam obrigatoriamente o responsável (`actorId`) e o motivo (`reason`), resolvendo os requisitos de governança da Issue #30.
