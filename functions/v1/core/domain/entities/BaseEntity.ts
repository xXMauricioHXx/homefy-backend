export abstract class BaseEntity {
  public readonly id?: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;

  constructor(props: { id?: string; createdAt?: string; updatedAt?: string }) {
    this.id = props.id;
    this.createdAt = props.createdAt ?? new Date().toISOString();
    this.updatedAt = props.updatedAt ?? new Date().toISOString();
  }
}
