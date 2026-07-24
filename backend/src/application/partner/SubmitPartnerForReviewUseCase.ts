// backend/src/application/partner/SubmitPartnerForReviewUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { Result } from '../../domain/Result';

export interface SubmitPartnerForReviewDTO {
  partnerId: string;
  userId:    string; // ID do usuário responsável que tenta submeter
}

export class SubmitPartnerForReviewUseCase {
  constructor(private readonly partnerRepository: IPartnerRepository) {}

  async execute(dto: SubmitPartnerForReviewDTO): Promise<Result<void>> {
    // 1. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 2. Verificar se o usuário que tenta submeter é o dono
    if (partner.userId !== dto.userId) {
      return Result.fail<void>('Acesso negado: Apenas o usuário responsável pode submeter o parceiro para revisão.');
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
