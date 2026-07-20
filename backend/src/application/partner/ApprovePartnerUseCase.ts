// backend/src/application/partner/ApprovePartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface ApprovePartnerDTO {
  partnerId:   string;
  adminUserId: string;
  isActive:    boolean;
}

export class ApprovePartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: ApprovePartnerDTO): Promise<Result<void>> {
    // 1. Validar se o usuário que aprova é admin
    const adminUser = await this.userRepository.findById(dto.adminUserId);
    if (!adminUser) {
      return Result.fail<void>('Usuário administrador não encontrado.');
    }

    if (adminUser.role !== UserRole.ADMIN) {
      return Result.fail<void>('Acesso negado: Apenas administradores podem aprovar ou suspender parceiros.');
    }

    // 2. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 3. Atualizar status
    if (dto.isActive) {
      partner.activate();
    } else {
      partner.inactivate();
    }

    await this.partnerRepository.update(partner);

    return Result.ok<void>(undefined);
  }
}
