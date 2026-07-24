// backend/src/application/partner/GetPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Result } from '../../domain/Result';
import { PartnerResponseDTO } from './RegisterPartnerUseCase';

export interface GetPartnerDTO {
  partnerId?: string;
  userId?:    string;
}

export class GetPartnerUseCase {
  constructor(private readonly partnerRepository: IPartnerRepository) {}

  async execute(dto: GetPartnerDTO): Promise<Result<PartnerResponseDTO>> {
    let partner = null;

    if (dto.partnerId) {
      partner = await this.partnerRepository.findById(dto.partnerId);
    } else if (dto.userId) {
      const partners = await this.partnerRepository.findAllByUserId(dto.userId);
      partner = partners.length > 0 ? partners[0] : null;
    } else {
      return Result.fail<PartnerResponseDTO>('Parâmetro id ou userId é obrigatório para a busca.');
    }

    if (!partner) {
      return Result.fail<PartnerResponseDTO>('Parceiro comercial não encontrado.');
    }

    return Result.ok<PartnerResponseDTO>({
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
    });
  }
}
