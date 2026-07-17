// backend/src/domain/partner/Partner.ts
import { Entity } from '../Entity';
import { Result } from '../Result';

export interface PartnerProps {
  userId:      string;
  name:        string;
  cnpj?:       string;
  description: string;
  address:     string;
  phone:       string;
  isActive:    boolean;
}

/**
 * Partner — Entidade raiz do Bounded Context de Catálogo de Parceiros.
 * Mapeia estabelecimentos (Carlos, a Persona 2) no ecossistema CeLiLac.
 */
export class Partner extends Entity<PartnerProps> {
  private constructor(props: PartnerProps, id?: string) {
    super(props, id);
  }

  get userId(): string { return this.props.userId; }
  get name(): string { return this.props.name; }
  get cnpj(): string | undefined { return this.props.cnpj; }
  get description(): string { return this.props.description; }
  get address(): string { return this.props.address; }
  get phone(): string { return this.props.phone; }
  get isActive(): boolean { return this.props.isActive; }

  static create(props: PartnerProps, id?: string): Result<Partner> {
    if (!props.userId) {
      return Result.fail<Partner>('O ID de usuário do dono é obrigatório.');
    }
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Partner>('O nome comercial do parceiro é obrigatório.');
    }
    if (props.cnpj && props.cnpj.trim().length > 0) {
      const cleanCnpj = props.cnpj.replace(/\D/g, '');
      if (cleanCnpj.length !== 14) {
        return Result.fail<Partner>('CNPJ inválido (deve conter 14 dígitos).');
      }
    }
    if (!props.address || props.address.trim().length === 0) {
      return Result.fail<Partner>('O endereço do parceiro é obrigatório.');
    }

    return Result.ok<Partner>(
      new Partner(
        {
          userId: props.userId,
          name: props.name.trim(),
          cnpj: props.cnpj ? props.cnpj.trim() : undefined,
          description: (props.description || '').trim(),
          address: props.address.trim(),
          phone: (props.phone || '').trim(),
          isActive: props.isActive ?? true,
        },
        id
      )
    );
  }
}
