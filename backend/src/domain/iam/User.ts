// backend/src/domain/iam/User.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { Email } from './value-objects/Email';
import { PasswordHash } from './value-objects/PasswordHash';
import { UserRole } from './value-objects/UserRole';

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
  accountStatus?: AccountStatus;
  profileEvaluationStatus?: ProfileEvaluationStatus;
}

/**
 * User — Entidade raiz do contexto IAM.
 * Regras de domínio:
 *  - Nunca expõe senha em plaintext.
 *  - Role deve ser um dos valores definidos em UserRole.
 *  - Contas de ADMIN criadas iniciam em PENDING_APPROVAL sem acesso até aprovação.
 *  - Suporta avatar/foto com limite máximo de 10MB.
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

  get accountStatus(): AccountStatus {
    return this.props.accountStatus || 'ACTIVE';
  }

  get profileEvaluationStatus(): ProfileEvaluationStatus {
    return this.props.profileEvaluationStatus || 'PENDING_EVALUATION';
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

  public updateProfileDetails(details: {
    fullName?: string;
    birthDate?: Date;
    gender?: string;
    avatarUrl?: string;
  }): Result<void> {
    if (details.avatarUrl) {
      // Validação de limite de 10MB para imagem em base64 (10MB ~ 13.5MB de caracteres base64)
      if (details.avatarUrl.startsWith('data:image/') && details.avatarUrl.length > 14 * 1024 * 1024) {
        return Result.fail<void>('O tamanho da foto de perfil não pode exceder 10MB.');
      }
    }

    if (details.fullName !== undefined) this.props.fullName = details.fullName;
    if (details.birthDate !== undefined) this.props.birthDate = details.birthDate;
    if (details.gender !== undefined) this.props.gender = details.gender;
    if (details.avatarUrl !== undefined) this.props.avatarUrl = details.avatarUrl;

    return Result.ok<void>(undefined as any);
  }

  static create(props: UserProps, id?: string): Result<User> {
    if (!Object.values(UserRole).includes(props.role)) {
      return Result.fail<User>('Role de usuário inválida.');
    }
    return Result.ok<User>(new User(props, id));
  }
}
