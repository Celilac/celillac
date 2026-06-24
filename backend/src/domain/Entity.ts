// backend/src/domain/Entity.ts
export abstract class Entity<T> {
  protected readonly _id: string;
  public readonly props: T;

  constructor(props: T, id?: string) {
    this.props = props;
    this._id = id ?? 'generated-uuid';
  }
}
