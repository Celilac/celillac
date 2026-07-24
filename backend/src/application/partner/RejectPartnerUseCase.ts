// backend/src/application/partner/RejectPartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface RejectPartnerDTO {
  partnerId:   string;
  adminUserId: string;
  reason:      string;
}

export class RejectPartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: RejectPartnerDTO): Promise<Result<void>> {
    // 1. Validar se o usuário executor é admin
    const adminUser = await this.userRepository.findById(dto.adminUserId);
    if (!adminUser) {
      return Result.fail<void>('Usuário administrador não encontrado.');
    }

    if (adminUser.role !== UserRole.ADMIN) {
      return Result.fail<void>('Acesso negado: Apenas administradores podem rejeitar parceiros.');
    }

    // 2. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 3. Executar transição no domínio
    const rejectResult = partner.reject(dto.reason);
    if (rejectResult.isFailure) {
      return Result.fail<void>(rejectResult.getError());
    }

    // 4. Persistir no banco de dados
    await this.partnerRepository.update(partner);

    return Result.ok<void>(undefined);
  }
}
