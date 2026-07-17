// backend/src/domain/partner/repositories/IPartnerRepository.ts
import { Partner } from '../Partner';

export interface IPartnerRepository {
  create(partner: Partner): Promise<void>;
  findById(id: string): Promise<Partner | null>;
  findByUserId(userId: string): Promise<Partner | null>;
  update(partner: Partner): Promise<void>;
}
