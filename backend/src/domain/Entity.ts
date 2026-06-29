// backend/src/domain/Entity.ts
import { v4 as uuidv4 } from 'uuid';

export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this.props = props;
    this._id   = id ?? uuidv4();
  }

  get id(): string {
    return this._id;
  }
}
