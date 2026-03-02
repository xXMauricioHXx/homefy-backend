export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<string>;
  update(id: string, data: Partial<T>): Promise<void>;
}
