// backend/src/application/partner/ListAdminPartnersUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { PartnerResponseDTO } from './RegisterPartnerUseCase';

export interface ListAdminPartnersDTO {
  adminUserId: string;
}

export class ListAdminPartnersUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: ListAdminPartnersDTO): Promise<Result<PartnerResponseDTO[]>> {
    // 1. Validar se é admin
    const adminUser = await this.userRepository.findById(dto.adminUserId);
    if (!adminUser || adminUser.role !== UserRole.ADMIN) {
      return Result.fail<PartnerResponseDTO[]>('Acesso negado: Apenas administradores podem listar parceiros para moderação.');
    }

    // 2. Buscar todos os parceiros
    const partners = await this.partnerRepository.findAll();

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
    }));

    return Result.ok<PartnerResponseDTO[]>(response);
  }
}
