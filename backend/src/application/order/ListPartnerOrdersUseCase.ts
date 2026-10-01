// backend/src/application/order/ListPartnerOrdersUseCase.ts
import { Result } from '../../domain/Result';
import { Order } from '../../domain/order/entities/Order';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';

export interface ListPartnerOrdersDTO {
  partnerId: string;
  userId: string;
  userRole: string;
}

export class ListPartnerOrdersUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly partnerRepository: IPartnerRepository
  ) {}

  async execute(dto: ListPartnerOrdersDTO): Promise<Result<Order[]>> {
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<Order[]>('Estabelecimento parceiro não encontrado.');
    }

    if (dto.userRole !== 'ADMIN' && partner.userId !== dto.userId) {
      return Result.fail<Order[]>('Acesso negado: você não tem permissão para visualizar pedidos deste estabelecimento.');
    }

    const orders = await this.orderRepository.findByPartnerId(dto.partnerId);
    return Result.ok<Order[]>(orders);
  }
}
