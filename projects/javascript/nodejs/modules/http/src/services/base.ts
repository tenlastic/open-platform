import * as requestPromiseNative from 'request-promise-native';

import { accessToken } from '../access-token';
import { BaseModel } from '../models';
import { BaseStore } from '../stores';

export abstract class BaseService<T extends BaseModel> {
  protected store: BaseStore<T>;
  protected url: string;

  // Using Getter since Access Token may change.
  private get headers() {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates a Record.
   */
  public async create(json: T): Promise<T> {
    const { record } = await requestPromiseNative.post({
      headers: this.headers,
      json,
      url: this.url,
    });
    this.store.insert(record);
    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string): Promise<T> {
    this.store.delete(_id);

    try {
      const { record } = await requestPromiseNative.delete({
        headers: this.headers,
        json: true,
        url: `${this.url}/${_id}`,
      });
      return record;
    } catch {}
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any): Promise<T[]> {
    const { records } = await requestPromiseNative.get({
      headers: this.headers,
      json: true,
      qs: JSON.stringify(query),
      url: this.url,
    });
    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string): Promise<T> {
    const { record } = await requestPromiseNative.get({
      headers: this.headers,
      json: true,
      url: `${this.url}/${_id}`,
    });
    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: T): Promise<T> {
    const { record } = await requestPromiseNative.put({
      headers: this.headers,
      json,
      url: `${this.url}/${_id}`,
    });
    this.store.update(record);
    return record;
  }
}
