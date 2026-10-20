// backend/src/application/partner/RegisterPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Partner, PartnerType, PartnerApprovalStatus, PartnerOperationalStatus, LegalNature, DocumentType } from '../../domain/partner/Partner';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface RegisterPartnerDTO {
  userId:          string;
  name:            string;
  cnpj?:           string;
  legalNature?:    LegalNature;
  documentNumber?: string;
  documentType?:   DocumentType;
  documentUrl?:    string;
  companyName?:    string;
  responsibleName?:string;
  description:     string;
  address:         string;
  phone:           string;
  type:            PartnerType;
  city?:           string;
  state?:          string;
  deliveryRegion?: string;
  logoUrl?:        string;
  isDraft?:        boolean;
}

export interface PartnerResponseDTO {
  id:                 string;
  userId:             string;
  name:               string;
  cnpj?:              string;
  legalNature:        string;
  documentNumber?:    string;
  documentType:       string;
  documentUrl?:       string;
  companyName?:       string;
  responsibleName?:   string;
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

    // 2. Verificar se o usuário tem o papel de PARCEIRO ou ADMIN
    if (user.role !== UserRole.PARCEIRO && user.role !== UserRole.ADMIN) {
      return Result.fail<PartnerResponseDTO>('Apenas usuários com o papel de PARCEIRO ou ADMINISTRADOR podem cadastrar um perfil comercial.');
    }

    const isAdmin = user.role === UserRole.ADMIN;

    // 3. Determinar o status inicial de aprovação:
    // - Admin: Aprovado imediatamente (para testes e operação ágil)
    // - isDraft === true: Permanece em Rascunho se explicitamente solicitado
    // - Parceiro (padrão): Enviado imediatamente para análise e moderação (PENDING_REVIEW)
    let initialApprovalStatus: PartnerApprovalStatus;
    let initialOperationalStatus: PartnerOperationalStatus;

    if (isAdmin) {
      initialApprovalStatus = PartnerApprovalStatus.APPROVED;
      initialOperationalStatus = PartnerOperationalStatus.ACTIVE;
    } else if (dto.isDraft) {
      initialApprovalStatus = PartnerApprovalStatus.DRAFT;
      initialOperationalStatus = PartnerOperationalStatus.INACTIVE;
    } else {
      initialApprovalStatus = PartnerApprovalStatus.PENDING_REVIEW;
      initialOperationalStatus = PartnerOperationalStatus.INACTIVE;
    }

    const partnerResult = Partner.create({
      userId:            dto.userId,
      name:              dto.name,
      cnpj:              dto.cnpj,
      legalNature:       dto.legalNature,
      documentNumber:    dto.documentNumber,
      documentType:      dto.documentType,
      documentUrl:       dto.documentUrl,
      companyName:       dto.companyName,
      responsibleName:   dto.responsibleName,
      description:       dto.description,
      address:           dto.address,
      phone:             dto.phone,
      type:              dto.type,
      city:              dto.city,
      state:             dto.state,
      deliveryRegion:    dto.deliveryRegion,
      logoUrl:           dto.logoUrl,
      approvalStatus:    initialApprovalStatus,
      operationalStatus: initialOperationalStatus,
    });

    if (partnerResult.isFailure) {
      return Result.fail<PartnerResponseDTO>(partnerResult.getError());
    }

    const partner = partnerResult.getValue();

    // 4. Se tiver documento informado, verificar se já existe outro parceiro cadastrado
    const docToCheck = partner.documentNumber || partner.cnpj;
    if (docToCheck) {
      const existingPartner = await this.partnerRepository.findByDocumentNumber(docToCheck);
      if (existingPartner) {
        return Result.fail<PartnerResponseDTO>(
          `Já existe um estabelecimento cadastrado com este ${partner.documentType || 'documento'}.`
        );
      }
    }

    await this.partnerRepository.create(partner);

    return Result.ok<PartnerResponseDTO>({
      id:                 partner.id,
      userId:             partner.userId,
      name:               partner.name,
      cnpj:               partner.cnpj,
      legalNature:        partner.legalNature,
      documentNumber:     partner.documentNumber,
      documentType:       partner.documentType,
      documentUrl:        partner.documentUrl,
      companyName:        partner.companyName,
      responsibleName:    partner.responsibleName,
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
