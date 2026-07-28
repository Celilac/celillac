// backend/src/domain/consumer/Consumer.ts
import { Entity } from '../Entity';
import { Result } from '../Result';
import { ConsumerStatus } from './value-objects/ConsumerStatus';

export interface ConsumerProps {
  userId: string;
  generalPreferences?: Record<string, any>;
  isFoodProfileComplete?: boolean;
  isFoodProfileCritical?: boolean;
  status?: ConsumerStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Consumer — Agregado Raiz do Domínio de Consumidores no CeLiLac.
 *
 * Responsabilidades:
 *  - Representar o papel da pessoa usuária como consumidora.
 *  - Vincular a identidade (User) com seu perfil de consumo.
 *  - Controlar se possui perfil alimentar configurado e se é crítico.
 *  - Manter preferências gerais de experiência.
 */
export class Consumer extends Entity<ConsumerProps> {
  private constructor(props: ConsumerProps, id?: string) {
    super(
      {
        ...props,
        generalPreferences: props.generalPreferences || {},
        isFoodProfileComplete: props.isFoodProfileComplete ?? false,
        isFoodProfileCritical: props.isFoodProfileCritical ?? false,
        status: props.status || ConsumerStatus.CONTA_CRIADA,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id,
    );
  }

  get userId(): string {
    return this.props.userId;
  }

  get generalPreferences(): Record<string, any> {
    return { ...this.props.generalPreferences };
  }

  get isFoodProfileComplete(): boolean {
    return !!this.props.isFoodProfileComplete;
  }

  get isFoodProfileCritical(): boolean {
    return !!this.props.isFoodProfileCritical;
  }

  get status(): ConsumerStatus {
    return this.props.status || ConsumerStatus.CONTA_CRIADA;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }

  public markFoodProfileState(isComplete: boolean, isCritical: boolean): void {
    this.props.isFoodProfileComplete = isComplete;
    this.props.isFoodProfileCritical = isCritical;

    if (!isComplete) {
      this.props.status = ConsumerStatus.PERFIL_INCOMPLETO;
    } else if (isCritical) {
      this.props.status = ConsumerStatus.PERFIL_CRITICO;
    } else {
      this.props.status = ConsumerStatus.PERFIL_CONFIGURADO;
    }

    this.props.updatedAt = new Date();
  }

  public updatePreferences(newPreferences: Record<string, any>): void {
    this.props.generalPreferences = {
      ...this.props.generalPreferences,
      ...newPreferences,
    };
    this.props.updatedAt = new Date();
  }

  public updateStatus(status: ConsumerStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  public static create(props: ConsumerProps, id?: string): Result<Consumer> {
    if (!props.userId || props.userId.trim().length === 0) {
      return Result.fail<Consumer>('O userId do consumidor não pode ser vazio.');
    }

    return Result.ok<Consumer>(new Consumer(props, id));
  }
}
