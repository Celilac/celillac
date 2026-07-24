// backend/src/application/partner/UpdatePartnerOperationalStatusUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { Result } from '../../domain/Result';
import { PartnerOperationalStatus } from '../../domain/partner/Partner';
import { UserRole } from '../../domain/iam/value-objects/UserRole';

export interface UpdatePartnerOperationalStatusDTO {
  partnerId:   string;
  userId:      string; // ID do usuário realizando a ação
  status:      PartnerOperationalStatus;
}

export class UpdatePartnerOperationalStatusUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: UpdatePartnerOperationalStatusDTO): Promise<Result<void>> {
    // 1. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 2. Validar se é o dono ou admin
    const user = await this.userRepository.findById(dto.userId);
    const isOwner = partner.userId === dto.userId;
    const isAdmin = user && user.role === UserRole.ADMIN;

    if (!isOwner && !isAdmin) {
      return Result.fail<void>('Acesso negado: Apenas o responsável ou administradores podem alterar o status operacional.');
    }

    // 3. Executar transição no domínio
    const updateResult = partner.updateOperationalStatus(dto.status);
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    // 4. Persistir no banco de dados
    await this.partnerRepository.update(partner);

    return Result.ok<void>(undefined);
  }
}
