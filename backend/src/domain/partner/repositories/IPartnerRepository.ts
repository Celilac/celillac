// backend/src/domain/partner/repositories/IPartnerRepository.ts
import { Partner } from '../Partner';

export interface IPartnerRepository {
  create(partner: Partner): Promise<void>;
  findById(id: string): Promise<Partner | null>;
  findAllByUserId(userId: string): Promise<Partner[]>;
  findAll(): Promise<Partner[]>;
  update(partner: Partner): Promise<void>;
}
