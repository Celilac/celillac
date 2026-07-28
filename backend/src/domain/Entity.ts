// backend/src/domain/Entity.ts
import { randomUUID } from 'crypto';

export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this.props = props;
    this._id   = id ?? randomUUID();
  }

  get id(): string {
    return this._id;
  }
}
