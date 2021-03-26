import * as requestPromiseNative from 'request-promise-native';

import { BaseModel } from '../models';
import { BaseStore } from '../stores';

const accessToken = process.env.ACCESS_TOKEN;

export abstract class BaseService<T extends BaseModel> {
  protected store: BaseStore<T>;
  protected url: string;

  private headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  public async create(json: T): Promise<T> {
    const { record } = await requestPromiseNative.post({
      headers: this.headers,
      json,
      url: this.url,
    });
    this.store.insert(record);
    return record;
  }

  public async delete(_id: string): Promise<T> {
    try {
      const { record } = await requestPromiseNative.delete({
        headers: this.headers,
        json: true,
        url: `${this.url}/${_id}`,
      });
      return record;
    } finally {
      this.store.delete(_id);
    }
  }

  public async find(query: any): Promise<T[]> {
    const { records } = await requestPromiseNative.get({
      headers: this.headers,
      json: true,
      qs: JSON.stringify(query),
      url: this.url,
    });
    return records;
  }

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
