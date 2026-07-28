// backend/src/domain/iam/EmailVerification.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface EmailVerificationProps {
  userId: string;
  code: string;
  expiresAt: Date;
  isUsed?: boolean;
  createdAt?: Date;
}

export class EmailVerification extends Entity<EmailVerificationProps> {
  private constructor(props: EmailVerificationProps, id?: string) {
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
    // Gera um código numérico de 6 dígitos aleatório (ex: 482910)
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  public static create(props: EmailVerificationProps, id?: string): Result<EmailVerification> {
    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail<EmailVerification>('O userId não pode ser vazio.');
    }
    if (!props.code || props.code.trim().length !== 6) {
      return Result.fail<EmailVerification>('O código de verificação deve possuir exatamente 6 dígitos.');
    }
    return Result.ok<EmailVerification>(new EmailVerification(props, id));
  }
}
