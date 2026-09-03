// backend/src/application/partner/RegisterPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus } from '../../domain/partner/Partner';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface RegisterPartnerDTO {
  userId:          string;
  name:            string;
  cnpj?:           string;
  description:     string;
  address:         string;
  phone:           string;
  type:            PartnerType;
  city?:           string;
  state?:          string;
  deliveryRegion?: string;
  logoUrl?:        string;
}

export interface PartnerResponseDTO {
  id:                 string;
  userId:             string;
  name:               string;
  cnpj?:              string;
  description:        string;
  address:            string;
  phone:              string;
  type:               PartnerType;
  approvalStatus:     string;
  operationalStatus:  string;
  rejectionReason?:   string;
  suspensionReason?:  string;
  city?:              string;
  state?:             string;
  deliveryRegion?:    string;
  logoUrl?:           string;
}

export class RegisterPartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: RegisterPartnerDTO): Promise<Result<PartnerResponseDTO>> {
    // 1. Verificar se o usuário existe
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      return Result.fail<PartnerResponseDTO>('Usuário não encontrado.');
    }

    // 2. Verificar se o usuário tem o papel de PARCEIRO
    if (user.role !== UserRole.PARCEIRO) {
      return Result.fail<PartnerResponseDTO>('Apenas usuários com o papel de PARCEIRO podem cadastrar um perfil comercial.');
    }

    // 3. Criar o Parceiro (inicia como DRAFT e INACTIVE)
    const partnerResult = Partner.create({
      userId:            dto.userId,
      name:              dto.name,
      cnpj:              dto.cnpj,
      description:       dto.description,
      address:           dto.address,
      phone:             dto.phone,
      type:              dto.type,
      city:              dto.city,
      state:             dto.state,
      deliveryRegion:    dto.deliveryRegion,
      logoUrl:           dto.logoUrl,
      approvalStatus:    PartnerApprovalStatus.DRAFT,
      operationalStatus: PartnerOperationalStatus.INACTIVE,
    });

    if (partnerResult.isFailure) {
      return Result.fail<PartnerResponseDTO>(partnerResult.getError());
    }

    const partner = partnerResult.getValue();
    await this.partnerRepository.create(partner);

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
      logoUrl:            partner.logoUrl,
    });
  }
}
