// backend/src/domain/iam/PasswordReset.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface PasswordResetProps {
  userId: string;
  code: string;
  expiresAt: Date;
  isUsed?: boolean;
  createdAt?: Date;
}

export class PasswordReset extends Entity<PasswordResetProps> {
  private constructor(props: PasswordResetProps, id?: string) {
    super(
      {
        ...props,
        isUsed: props.isUsed ?? false,
        createdAt: props.createdAt || new Date(),
      },
      id,
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get code(): string {
    return this.props.code;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isUsed(): boolean {
    return !!this.props.isUsed;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public markAsUsed(): void {
    this.props.isUsed = true;
  }

  public static generateCode(): string {
    // Gera um código numérico aleatório de 6 dígitos (ex: 739104)
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static create(props: PasswordResetProps, id?: string): Result<PasswordReset> {
    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail<PasswordReset>('O userId não pode ser vazio.');
    }
    if (!props.code || props.code.trim().length !== 6) {
      return Result.fail<PasswordReset>('O código de recuperação deve possuir exatamente 6 dígitos.');
    }
    return Result.ok<PasswordReset>(new PasswordReset(props, id));
  }
}
