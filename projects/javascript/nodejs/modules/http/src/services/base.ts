import { BaseModel } from '../models';
import * as request from '../request';
import { BaseStore } from '../stores';

export abstract class BaseService<T extends BaseModel> {
  protected store: BaseStore<T>;
  protected abstract get url(): string;

  /**
   * Creates a Record.
   */
  public async create(json: T): Promise<T> {
    const { record } = await request.promise(this.url, { json, method: 'post' });
    this.store.insert(record);
    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string): Promise<T> {
    this.store.delete(_id);

    try {
      const { record } = await request.promise(`${this.url}/${_id}`, {
        json: true,
        method: 'delete',
      });
      return record;
    } catch {}
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any): Promise<T[]> {
    const { records } = await request.promise(this.url, {
      json: true,
      method: 'get',
      qs: { query: JSON.stringify(query) },
    });
    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string): Promise<T> {
    const { record } = await request.promise(`${this.url}/${_id}`, { json: true, method: 'get' });
    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: T): Promise<T> {
    const { record } = await request.promise(`${this.url}/${_id}`, { json });
    this.store.update(record);
    return record;
  }
}
