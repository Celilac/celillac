// backend/src/domain/partner/services/VerifyPartnerPublicationCapability.ts
import { Partner, PartnerApprovalStatus, PartnerOperationalStatus } from '../Partner';

export class VerifyPartnerPublicationCapability {
  /**
   * Verifica se o parceiro está apto a cadastrar, publicar ou atualizar produtos no catálogo.
   * Ele deve estar aprovado administrativamente e operacionalmente ativo ou fechado temporariamente (não inativo).
   */
  static check(partner: Partner): boolean {
    return (
      partner.approvalStatus === PartnerApprovalStatus.APPROVED &&
      (partner.operationalStatus === PartnerOperationalStatus.ACTIVE ||
       partner.operationalStatus === PartnerOperationalStatus.TEMPORARILY_CLOSED)
    );
  }
}
