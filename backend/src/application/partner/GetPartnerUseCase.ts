// backend/src/application/partner/GetPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { VerifyPartnerPublicationCapability } from '../../domain/partner/services/VerifyPartnerPublicationCapability';
import { Result } from '../../domain/Result';
import { PartnerResponseDTO } from './RegisterPartnerUseCase';

export interface GetPartnerDTO {
  partnerId?:   string;
  userId?:      string;
  requesterId?: string; // ID de quem está consultando, usado para decidir o que pode ser visto
}

export class GetPartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository?: IUserRepository,
  ) {}

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

    // O dono e administradores podem ver o cadastro completo, em qualquer estado.
    const isOwner = !!dto.requesterId && partner.userId === dto.requesterId;
    let isAdmin = false;
    if (!isOwner && dto.requesterId && this.userRepository) {
      const requester = await this.userRepository.findById(dto.requesterId);
      isAdmin = !!requester && requester.role === UserRole.ADMIN;
    }

    // Qualquer outro solicitante só pode ver o parceiro se ele estiver publicamente apto
    // (aprovado e operacionalmente ativo ou temporariamente fechado) — RN-PARTNER-04/05/07/08/09.
    const isPublicView = !isOwner && !isAdmin;
    if (isPublicView && !VerifyPartnerPublicationCapability.check(partner)) {
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
      // Motivos de rejeição/suspensão são informação administrativa: só o dono ou admin veem.
      rejectionReason:    isPublicView ? undefined : partner.rejectionReason,
      suspensionReason:   isPublicView ? undefined : partner.suspensionReason,
      city:               partner.city,
      state:              partner.state,
      deliveryRegion:     partner.deliveryRegion,
      logoUrl:            partner.logoUrl,
    });
  }
}
