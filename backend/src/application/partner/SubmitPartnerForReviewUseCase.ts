// backend/src/application/partner/SubmitPartnerForReviewUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { Result } from '../../domain/Result';

export interface SubmitPartnerForReviewDTO {
  partnerId: string;
  userId:    string; // ID do usuário responsável que tenta submeter
}

export class SubmitPartnerForReviewUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository?: IUserRepository,
  ) {}

  async execute(dto: SubmitPartnerForReviewDTO): Promise<Result<void>> {
    // 1. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 2. Verificar se o usuário que tenta submeter é o dono ou admin
    const isOwner = partner.userId === dto.userId;
    let isAdmin = false;
    if (this.userRepository) {
      const user = await this.userRepository.findById(dto.userId);
      isAdmin = !!user && user.role === UserRole.ADMIN;
    }

    if (!isOwner && !isAdmin) {
      return Result.fail<void>('Acesso negado: Apenas o usuário responsável ou administradores podem submeter o parceiro para revisão.');
    }

    // 3. Executar transição no domínio
    const submitResult = partner.submitForReview();
    if (submitResult.isFailure) {
      return Result.fail<void>(submitResult.getError());
    }

    // 4. Persistir no banco de dados
    await this.partnerRepository.update(partner);

    return Result.ok<void>(undefined);
  }
}
