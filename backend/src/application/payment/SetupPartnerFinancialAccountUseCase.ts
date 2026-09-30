// backend/src/application/payment/SetupPartnerFinancialAccountUseCase.ts
import { Result } from '../../domain/Result';
import { IPartnerRepository } from '../../domain/partner/repositories/IPartnerRepository';
import { IPartnerFinancialAccountRepository } from '../../domain/payment/repositories/IPartnerFinancialAccountRepository';
import { IPaymentGateway } from '../../domain/payment/services/IPaymentGateway';
import {
  PartnerFinancialAccount,
  PixKeyType,
  BankAccountType,
} from '../../domain/payment/entities/PartnerFinancialAccount';

export interface SetupFinancialAccountDTO {
  partnerId: string;
  userId: string;
  userRole: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: BankAccountType;
}

export class SetupPartnerFinancialAccountUseCase {
  constructor(
    private readonly partnerRepository: IPartnerRepository,
    private readonly financialAccountRepository: IPartnerFinancialAccountRepository,
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(dto: SetupFinancialAccountDTO): Promise<Result<PartnerFinancialAccount>> {
    const partner = await this.partnerRepository.findById(dto.partnerId);
    if (!partner) {
      return Result.fail<PartnerFinancialAccount>('Estabelecimento comercial não encontrado.');
    }

    if (dto.userRole !== 'ADMIN' && partner.userId !== dto.userId) {
      return Result.fail<PartnerFinancialAccount>(
        'Acesso negado: apenas o proprietário do estabelecimento pode gerenciar dados financeiros.'
      );
    }

    let account = await this.financialAccountRepository.findByPartnerId(dto.partnerId);

    if (!account) {
      // 1. Provisionar subconta no gateway Asaas para split de recebíveis
      const subaccountRes = await this.paymentGateway.createSubaccount({
        partnerId: partner.id,
        name: partner.name,
        email: 'financeiro@' + partner.name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com.br',
        cpfCnpj: partner.cnpj || '00.000.000/0000-00',
        phone: partner.phone,
        address: partner.address,
      });

      const subaccountId = subaccountRes.isSuccess ? subaccountRes.getValue().subaccountId : undefined;

      const newAccountRes = PartnerFinancialAccount.create({
        partnerId: partner.id,
        gatewaySubaccountId: subaccountId,
        pixKey: dto.pixKey,
        pixKeyType: dto.pixKeyType,
        bankCode: dto.bankCode,
        agencyNumber: dto.agencyNumber,
        accountNumber: dto.accountNumber,
        accountType: dto.accountType,
        isVerified: !!subaccountId,
      });

      if (newAccountRes.isFailure) {
        return Result.fail<PartnerFinancialAccount>(newAccountRes.getError());
      }

      account = newAccountRes.getValue();
    } else {
      account.updatePixKey(dto.pixKey, dto.pixKeyType);
    }

    await this.financialAccountRepository.save(account);
    return Result.ok<PartnerFinancialAccount>(account);
  }
}
