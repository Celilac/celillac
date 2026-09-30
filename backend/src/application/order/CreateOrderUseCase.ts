// backend/src/application/order/CreateOrderUseCase.ts
import { Result } from '../../domain/Result';
import { IOrderRepository } from '../../domain/order/repositories/IOrderRepository';
import { IProductCatalogRepository } from '../../domain/catalog/repositories/IProductCatalogRepository';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IFoodProfileRepository } from '../../domain/food-profile/repositories/IFoodProfileRepository';
import { AllergenEngine } from '../../domain/allergen-engine/AllergenEngine';
import { ProductSnapshot } from '../../domain/allergen-engine/ProductSnapshot';
import { RiskLevel } from '../../domain/allergen-engine/RiskLevel';
import { Order } from '../../domain/order/entities/Order';
import { OrderItem } from '../../domain/order/entities/OrderItem';

export interface CreateOrderItemDTO {
  productId: string;
  quantity: number;
}

export interface CreateOrderDTO {
  consumerId: string;
  partnerId: string;
  items: CreateOrderItemDTO[];
  deliveryFee?: number;
  notes?: string;
}

export interface CreateOrderOutputDTO {
  orderId: string;
  status: string;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  allergenCheckVerdict: 'SAFE' | 'WARNING';
  itemsCount: number;
}

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductCatalogRepository,
    private readonly partnerRepository: IPartnerRepository,
    private readonly foodProfileRepository: IFoodProfileRepository
  ) {}

  async execute(dto: CreateOrderDTO): Promise<Result<CreateOrderOutputDTO>> {
    if (!dto.items || dto.items.length === 0) {
      return Result.fail<CreateOrderOutputDTO>('O pedido deve conter pelo menos um item.');
    }

    // 1. Validar existência e status operacional do parceiro
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<CreateOrderOutputDTO>('Estabelecimento comercial parceiro não encontrado.');
    }

    if (!partner.isActive) {
      return Result.fail<CreateOrderOutputDTO>(
        'O estabelecimento parceiro não está apto ou ativo para receber pedidos no momento.'
      );
    }

    // 2. Buscar perfil alimentar do celíaco (RN-CONSUMER-07 / Invariante 11.6)
    const profile = await this.foodProfileRepository.findByUserId(dto.consumerId);
    if (!profile || !profile.isActive()) {
      return Result.fail<CreateOrderOutputDTO>(
        'Você precisa ter um perfil alimentar configurado e ativo com suas restrições para realizar pedidos com segurança.'
      );
    }

    const orderItems: OrderItem[] = [];
    let overallVerdict: 'SAFE' | 'WARNING' = 'SAFE';

    // 3. Validar cada item e executar AllergenEngine (Invariante Biológica CeLiLac)
    for (const itemDto of dto.items) {
      if (!itemDto.productId || itemDto.quantity <= 0) {
        return Result.fail<CreateOrderOutputDTO>('Item do pedido possui dados inválidos de produto ou quantidade.');
      }

      const product = await this.productRepository.findById(itemDto.productId);
      if (!product) {
        return Result.fail<CreateOrderOutputDTO>(`Produto com ID ${itemDto.productId} não foi encontrado no catálogo.`);
      }

      if (product.partnerId !== partner.id) {
        return Result.fail<CreateOrderOutputDTO>(
          `O produto "${product.name}" não pertence ao estabelecimento selecionado.`
        );
      }

      if (!product.isActive) {
        return Result.fail<CreateOrderOutputDTO>(
          `O produto "${product.name}" está inativo ou indisponível para pedidos.`
        );
      }

      // Snapshot para o AllergenEngine
      const snapshot: ProductSnapshot = {
        id: product.id,
        name: product.name,
        ingredients: product.ingredients,
        hasGluten: product.hasGluten,
        crossContamination: product.crossContamination,
        declaredAllergens: product.declaredAllergens as Record<string, string>,
        crossContaminationDetails: product.crossContaminationDetails as any,
        certifications: product.certifications.map((c) => ({
          certificationType: c.certificationType,
          certifyingEntity: c.certifyingEntity,
          certificateCode: c.certificateCode,
          validUntil: c.validUntil,
          isVerified: c.verificationStatus === 'VERIFIED_BY_CELILAC',
          verificationStatus: c.verificationStatus,
        })),
        informationOrigin: product.informationOrigin,
      };

      const safetyReport = AllergenEngine.check(profile, snapshot);

      // Trava de segurança biológica
      if (safetyReport.riskLevel === RiskLevel.BLOCKED || safetyReport.riskLevel === RiskLevel.DANGER) {
        return Result.fail<CreateOrderOutputDTO>(
          `BLOQUEIO DE SEGURANÇA ALIMENTAR: O produto "${product.name}" é inseguro para seu perfil (${safetyReport.reasoning}). Pedido cancelado preventivamente.`
        );
      }

      if (safetyReport.riskLevel === RiskLevel.WARNING) {
        overallVerdict = 'WARNING';
      }

      const itemResult = OrderItem.create({
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        quantity: itemDto.quantity,
      });

      if (itemResult.isFailure) {
        return Result.fail<CreateOrderOutputDTO>(itemResult.getError());
      }

      orderItems.push(itemResult.getValue());
    }

    // 4. Instanciar agregado Order
    const orderResult = Order.create({
      consumerId: dto.consumerId,
      partnerId: dto.partnerId,
      items: orderItems,
      deliveryFee: dto.deliveryFee ?? 0,
      allergenCheckVerdict: overallVerdict,
      notes: dto.notes,
    });

    if (orderResult.isFailure) {
      return Result.fail<CreateOrderOutputDTO>(orderResult.getError());
    }

    const order = orderResult.getValue();

    // 5. Persistir pedido
    await this.orderRepository.save(order);

    return Result.ok<CreateOrderOutputDTO>({
      orderId: order.id,
      status: order.status,
      subtotalAmount: order.subtotalAmount,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      allergenCheckVerdict: order.allergenCheckVerdict,
      itemsCount: order.items.length,
    });
  }
}
