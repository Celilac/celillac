// backend/src/application/partner/ListUserPartnersUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Result } from '../../domain/Result';
import { PartnerResponseDTO } from './RegisterPartnerUseCase';

export interface ListUserPartnersDTO {
  userId: string;
}

export class ListUserPartnersUseCase {
  constructor(private readonly partnerRepository: IPartnerRepository) {}

  async execute(dto: ListUserPartnersDTO): Promise<Result<PartnerResponseDTO[]>> {
    const partners = await this.partnerRepository.findAllByUserId(dto.userId);

    const response: PartnerResponseDTO[] = partners.map(partner => ({
      id:                 partner.id,
      userId:             partner.userId,
      name:               partner.name,
      cnpj:               partner.cnpj,
      description:        partner.description,
      address:            partner.address,
      phone:              partner.phone,
      type:               partner.type,
      approvalStatus:     partner.approvalStatus,
      operationalStatus:  partner.operationalStatus,
      rejectionReason:    partner.rejectionReason,
      suspensionReason:   partner.suspensionReason,
      city:               partner.city,
      state:              partner.state,
      deliveryRegion:     partner.deliveryRegion,
      logoUrl:            partner.logoUrl,
    }));

    return Result.ok<PartnerResponseDTO[]>(response);
  }
}
