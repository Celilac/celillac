// backend/src/application/partner/ListPublicPartnersUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Result } from '../../domain/Result';
import { PartnerResponseDTO } from './RegisterPartnerUseCase';
import { PartnerApprovalStatus } from '../../domain/partner/Partner';

export class ListPublicPartnersUseCase {
  constructor(private readonly partnerRepository: IPartnerRepository) {}

  async execute(): Promise<Result<PartnerResponseDTO[]>> {
    // 1. Buscar todos os parceiros
    const allPartners = await this.partnerRepository.findAll();

    // 2. Filtrar apenas parceiros com cadastro aprovado
    const publicPartners = allPartners.filter(
      (partner) => partner.approvalStatus === PartnerApprovalStatus.APPROVED,
    );

    const response: PartnerResponseDTO[] = publicPartners.map((partner) => ({
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
    }));

    return Result.ok<PartnerResponseDTO[]>(response);
  }
}
