// backend/src/application/partner/UpdatePartnerUseCase.ts
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IUserRepository } from '../../domain/iam/repositories/IUserRepository';
import { UserRole } from '../../domain/iam/value-objects/UserRole';
import { Result } from '../../domain/Result';
import { PartnerType } from '../../domain/partner/Partner';

export interface UpdatePartnerDTO {
  partnerId:       string;
  userId:          string; // Usuário tentando atualizar
  name?:           string;
  cnpj?:           string;
  description?:    string;
  address?:        string;
  phone?:          string;
  type?:           PartnerType;
  city?:           string;
  state?:          string;
  deliveryRegion?: string;
}

export class UpdatePartnerUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly userRepository?: IUserRepository,
  ) {}

  async execute(dto: UpdatePartnerDTO): Promise<Result<void>> {
    // 1. Buscar o parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<void>('Parceiro comercial não encontrado.');
    }

    // 2. Verificar se o usuário que tenta atualizar é o dono ou admin
    const isOwner = partner.userId === dto.userId;
    let isAdmin = false;
    if (this.userRepository) {
      const user = await this.userRepository.findById(dto.userId);
      isAdmin = !!user && user.role === UserRole.ADMIN;
    }

    if (!isOwner && !isAdmin) {
      return Result.fail<void>('Acesso negado: Apenas o usuário responsável ou administradores podem editar este parceiro.');
    }

    // 3. Executar a alteração no domínio (se for crítica, o status regride automaticamente)
    const updateResult = partner.updateDetails({
      name:           dto.name,
      cnpj:           dto.cnpj,
      description:    dto.description,
      address:        dto.address,
      phone:          dto.phone,
      type:           dto.type,
      city:           dto.city,
      state:          dto.state,
      deliveryRegion: dto.deliveryRegion,
    });

    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.getError());
    }

    // 4. Persistir no banco de dados
    await this.partnerRepository.update(partner);

    return Result.ok<void>(undefined);
  }
}
