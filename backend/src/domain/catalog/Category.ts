// backend/src/domain/catalog/Category.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export type CategoryStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type CategoryVisibility = 'GLOBAL' | 'RESTRICTED';

export interface CategoryProps {
  name: string;
  normalizedName: string;
  partnerId?: string;
  createdByUserId?: string;
  status: CategoryStatus;
  visibility: CategoryVisibility;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryProps {
  name: string;
  partnerId?: string;
  createdByUserId?: string;
  status?: CategoryStatus;
  visibility?: CategoryVisibility;
  rejectionReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Category — Entidade do Contexto de Catálogo.
 * 
 * Regras:
 * 1. O nome da categoria é obrigatório e deve ter entre 2 e 100 caracteres.
 * 2. O nome normalizado remove acentos e converte para maiúsculo para controle de unicidade.
 * 3. Categorias criadas por parceiros nascem como PENDING_APPROVAL e RESTRICTED.
 * 4. A administração pode aprovar tornando GLOBAL (pública para todos) ou RESTRICTED (apenas para o parceiro criador).
 * 5. Categorias rejeitadas exigem justificativa textual.
 */
export class Category extends Entity<CategoryProps> {
  private constructor(props: CategoryProps, id?: string) {
    super(props, id);
  }

  get name(): string { return this.props.name; }
  get normalizedName(): string { return this.props.normalizedName; }
  get partnerId(): string | undefined { return this.props.partnerId; }
  get createdByUserId(): string | undefined { return this.props.createdByUserId; }
  get status(): CategoryStatus { return this.props.status; }
  get visibility(): CategoryVisibility { return this.props.visibility; }
  get rejectionReason(): string | undefined { return this.props.rejectionReason; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /**
   * Aprova a categoria tornando-a visível globalmente para todos os parceiros e clientes
   */
  approveAsGlobal(): void {
    this.props.status = 'APPROVED';
    this.props.visibility = 'GLOBAL';
    this.props.rejectionReason = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Aprova a categoria mantendo-a restrita ao parceiro que a registrou
   */
  approveAsRestricted(): void {
    this.props.status = 'APPROVED';
    this.props.visibility = 'RESTRICTED';
    this.props.rejectionReason = undefined;
    this.props.updatedAt = new Date();
  }

  /**
   * Rejeita a categoria com justificativa
   */
  reject(reason: string): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('O motivo da rejeição da categoria é obrigatório.');
    }
    this.props.status = 'REJECTED';
    this.props.rejectionReason = reason.trim();
    this.props.updatedAt = new Date();
    return Result.ok<void>(undefined);
  }

  isApproved(): boolean {
    return this.props.status === 'APPROVED';
  }

  isPending(): boolean {
    return this.props.status === 'PENDING_APPROVAL';
  }

  isRejected(): boolean {
    return this.props.status === 'REJECTED';
  }

  isGlobal(): boolean {
    return this.props.visibility === 'GLOBAL';
  }

  isRestricted(): boolean {
    return this.props.visibility === 'RESTRICTED';
  }

  isPubliclyVisible(): boolean {
    return this.props.status === 'APPROVED';
  }

  static normalizeName(name: string): string {
    return (name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  static create(props: CreateCategoryProps, id?: string): Result<Category> {
    if (!props.name || props.name.trim().length < 2) {
      return Result.fail<Category>('O nome da categoria deve ter pelo menos 2 caracteres.');
    }

    if (props.name.trim().length > 100) {
      return Result.fail<Category>('O nome da categoria não pode exceder 100 caracteres.');
    }

    const normalizedName = Category.normalizeName(props.name);
    const now = new Date();

    return Result.ok<Category>(
      new Category(
        {
          name: props.name.trim(),
          normalizedName,
          partnerId: props.partnerId,
          createdByUserId: props.createdByUserId,
          status: props.status || 'PENDING_APPROVAL',
          visibility: props.visibility || 'RESTRICTED',
          rejectionReason: props.rejectionReason,
          createdAt: props.createdAt || now,
          updatedAt: props.updatedAt || now,
        },
        id
      )
    );
  }
}
