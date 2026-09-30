// backend/src/domain/payment/repositories/IPartnerFinancialAccountRepository.ts
import { PartnerFinancialAccount } from '../entities/PartnerFinancialAccount';

export interface IPartnerFinancialAccountRepository {
  save(account: PartnerFinancialAccount): Promise<void>;
  findByPartnerId(partnerId: string): Promise<PartnerFinancialAccount | null>;
  findBySubaccountId(subaccountId: string): Promise<PartnerFinancialAccount | null>;
}
