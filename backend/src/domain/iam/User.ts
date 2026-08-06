// backend/src/domain/iam/User.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Email } from './value-objects/Email';
import { PasswordHash } from './value-objects/PasswordHash';
import { UserRole } from './value-objects/UserRole';
import { WhatsappPhone } from './value-objects/WhatsappPhone';

/**
 * UserProps — shape das propriedades internas da entidade.
 * Mantidas privadas via Entity<T>.props.
 */

export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'BLOCKED';
export type ProfileEvaluationStatus = 'PENDING_EVALUATION' | 'APPROVED' | 'REJECTED';

export interface UserProps {
  email: Email;
  passwordHash: PasswordHash;
  role: UserRole;
  fullName?: string;
  birthDate?: Date;
  gender?: string;
  avatarUrl?: string;
  whatsappPhone?: WhatsappPhone;
  accountStatus?: AccountStatus;
  profileEvaluationStatus?: ProfileEvaluationStatus;
  isEmailVerified?: boolean;
}

/**
 * User — Entidade raiz do contexto IAM.
 * Regras de domínio:
 *  - Nunca expõe senha em plaintext.
 *  - Role deve ser um dos valores definidos em UserRole.
 *  - Contas de ADMIN criadas iniciam em PENDING_APPROVAL sem acesso até aprovação.
 *  - Suporta avatar/foto com limite máximo de 10MB.
 *  - Controla o status de verificação do e-mail por código OTP.
 */
export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(
      {
        ...props,
        accountStatus:
          props.accountStatus ||
          (props.role === UserRole.ADMIN ? 'PENDING_APPROVAL' : 'ACTIVE'),
        profileEvaluationStatus: props.profileEvaluationStatus || 'PENDING_EVALUATION',
        isEmailVerified: props.isEmailVerified ?? false,
      },
      id,
    );
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): PasswordHash {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get fullName(): string | undefined {
    return this.props.fullName;
  }

  get birthDate(): Date | undefined {
    return this.props.birthDate;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get avatarUrl(): string | undefined {
    return this.props.avatarUrl;
  }

  get whatsappPhone(): WhatsappPhone | undefined {
    return this.props.whatsappPhone;
  }

  get accountStatus(): AccountStatus {
    return this.props.accountStatus || 'ACTIVE';
  }

  get profileEvaluationStatus(): ProfileEvaluationStatus {
    return this.props.profileEvaluationStatus || 'PENDING_EVALUATION';
  }

  get isEmailVerified(): boolean {
    return !!this.props.isEmailVerified;
  }

  public isPendingAdminApproval(): boolean {
    return (
      this.props.role === UserRole.ADMIN &&
      this.props.accountStatus === 'PENDING_APPROVAL'
    );
  }

  public approveAdminAccount(): void {
    if (this.props.role === UserRole.ADMIN) {
      this.props.accountStatus = 'ACTIVE';
      this.props.profileEvaluationStatus = 'APPROVED';
    }
  }

  public promoteToAdmin(): void {
    this.props.role = UserRole.ADMIN;
    this.props.accountStatus = 'ACTIVE';
    this.props.profileEvaluationStatus = 'APPROVED';
  }

  public evaluateProfile(status: ProfileEvaluationStatus): void {
    this.props.profileEvaluationStatus = status;
  }

  public verifyEmail(): void {
    this.props.isEmailVerified = true;
  }

  public updateProfileDetails(details: {
    fullName?: string;
    birthDate?: Date;
    gender?: string;
    avatarUrl?: string;
    whatsappPhone?: WhatsappPhone;
  }): Result<void> {
    if (details.avatarUrl) {
      if (details.avatarUrl.startsWith('data:image/') && details.avatarUrl.length > 14 * 1024 * 1024) {
        return Result.fail<void>('O tamanho da foto de perfil não pode exceder 10MB.');
      }
    }

    if (details.fullName !== undefined) this.props.fullName = details.fullName;
    if (details.birthDate !== undefined) this.props.birthDate = details.birthDate;
    if (details.gender !== undefined) this.props.gender = details.gender;
    if (details.avatarUrl !== undefined) this.props.avatarUrl = details.avatarUrl;
    if (details.whatsappPhone !== undefined) this.props.whatsappPhone = details.whatsappPhone;

    return Result.ok<void>(undefined as any);
  }

  static create(props: UserProps, id?: string): Result<User> {
    if (!Object.values(UserRole).includes(props.role)) {
      return Result.fail<User>('Role de usuário inválida.');
    }
    return Result.ok<User>(new User(props, id));
  }
}
