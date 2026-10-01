// backend/src/domain/payment/entities/PartnerFinancialAccount.ts
import { Entity } from '../../Entity';
import { Result } from '../../Result';

export type PixKeyType = 'CNPJ' | 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
export type BankAccountType = 'CHECKING' | 'SAVINGS';

export interface PartnerFinancialAccountProps {
  partnerId: string;
  gatewaySubaccountId?: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: BankAccountType;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFinancialAccountInputProps {
  partnerId: string;
  gatewaySubaccountId?: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  bankCode?: string;
  agencyNumber?: string;
  accountNumber?: string;
  accountType?: BankAccountType;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PartnerFinancialAccount extends Entity<PartnerFinancialAccountProps> {
  private constructor(props: PartnerFinancialAccountProps, id?: string) {
    super(props, id);
  }

  get partnerId(): string { return this.props.partnerId; }
  get gatewaySubaccountId(): string | undefined { return this.props.gatewaySubaccountId; }
  get pixKey(): string { return this.props.pixKey; }
  get pixKeyType(): PixKeyType { return this.props.pixKeyType; }
  get bankCode(): string | undefined { return this.props.bankCode; }
  get agencyNumber(): string | undefined { return this.props.agencyNumber; }
  get accountNumber(): string | undefined { return this.props.accountNumber; }
  get accountType(): BankAccountType | undefined { return this.props.accountType; }
  get isVerified(): boolean { return this.props.isVerified; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  public static create(
    props: CreateFinancialAccountInputProps,
    id?: string
  ): Result<PartnerFinancialAccount> {
    if (!props.partnerId || props.partnerId.trim() === '') {
      return Result.fail<PartnerFinancialAccount>('O ID do parceiro é obrigatório.');
    }

    if (!props.pixKey || props.pixKey.trim() === '') {
      return Result.fail<PartnerFinancialAccount>('A chave PIX é obrigatória para recebimento de repasses.');
    }

    const account = new PartnerFinancialAccount(
      {
        partnerId: props.partnerId,
        gatewaySubaccountId: props.gatewaySubaccountId,
        pixKey: props.pixKey.trim(),
        pixKeyType: props.pixKeyType,
        bankCode: props.bankCode,
        agencyNumber: props.agencyNumber,
        accountNumber: props.accountNumber,
        accountType: props.accountType,
        isVerified: props.isVerified ?? false,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id
    );

    return Result.ok<PartnerFinancialAccount>(account);
  }

  public setSubaccountId(subaccountId: string): void {
    this.props.gatewaySubaccountId = subaccountId;
    this.props.isVerified = true;
    this.props.updatedAt = new Date();
  }

  public updatePixKey(key: string, type: PixKeyType): void {
    this.props.pixKey = key.trim();
    this.props.pixKeyType = type;
    this.props.updatedAt = new Date();
  }
}
