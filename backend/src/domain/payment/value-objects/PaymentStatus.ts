// backend/src/domain/payment/value-objects/PaymentStatus.ts

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
}

export interface SplitCalculationResult {
  grossAmount: number;
  platformFeeAmount: number;
  netPartnerAmount: number;
}

export class SplitCalculator {
  // Padrão iFood Marketplace: Comissão de 12% sobre o subtotal de produtos para sustentabilidade da plataforma e laudos
  public static readonly DEFAULT_PLATFORM_FEE_RATE = 0.12;

  public static calculate(
    subtotalAmount: number,
    deliveryFee: number = 0,
    platformFeeRate: number = SplitCalculator.DEFAULT_PLATFORM_FEE_RATE
  ): SplitCalculationResult {
    const grossAmount = Number((subtotalAmount + deliveryFee).toFixed(2));
    const platformFeeAmount = Number((subtotalAmount * platformFeeRate).toFixed(2));
    const netPartnerAmount = Number((grossAmount - platformFeeAmount).toFixed(2));

    return {
      grossAmount,
      platformFeeAmount,
      netPartnerAmount,
    };
  }
}
