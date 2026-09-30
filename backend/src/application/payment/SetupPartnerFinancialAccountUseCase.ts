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
import { IAuditLogRepository } from '../../domain/audit/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/audit/AuditLog';
import { SecurityLogger } from '../../infrastructure/logging/SecurityLogger';
import { DataMasker } from '../../infrastructure/security/DataMasker';

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
    private readonly paymentGateway: IPaymentGateway,
    private readonly auditLogRepository?: IAuditLogRepository
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

    SecurityLogger.logPartnerFinancialAccountConfigured({
      ip: '127.0.0.1',
      actorId: dto.userId,
      partnerId: dto.partnerId,
      pixKeyType: dto.pixKeyType,
      pixKey: dto.pixKey,
      bankCode: dto.bankCode,
    });

    if (this.auditLogRepository) {
      const logRes = AuditLog.create({
        entityType: 'PARTNER_FINANCIAL_ACCOUNT',
        entityId: account.id,
        action: 'PARTNER_FINANCIAL_ACCOUNT_CONFIGURED',
        actorId: dto.userId,
        actorRole: dto.userRole,
        changes: {
          partnerId: dto.partnerId,
          pixKeyType: dto.pixKeyType,
          pixKey: DataMasker.maskPixKey(dto.pixKey),
          bankCode: dto.bankCode,
          accountType: dto.accountType,
        },
        reason: 'Configuração ou atualização de dados bancários/PIX para split Asaas',
      });
      if (logRes.isSuccess) {
        await this.auditLogRepository.save(logRes.getValue());
      }
    }

    return Result.ok<PartnerFinancialAccount>(account);
  }
}
