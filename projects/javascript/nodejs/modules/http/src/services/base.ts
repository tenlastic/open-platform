import { EventEmitter } from 'events';

import { BaseModel } from '../models';
import * as request from '../request';

export interface ServiceEvents<T extends BaseModel> {
  create: (record: T) => void;
  delete: (_id: string) => void;
  set: (records: T[]) => void;
  update: (record: T) => void;
}

export declare interface ServiceEventEmitter<T extends BaseModel> {
  emit<U extends keyof ServiceEvents<T>>(event: U, ...args: Parameters<ServiceEvents<T>[U]>);
  on<U extends keyof ServiceEvents<T>>(event: U, listener: ServiceEvents<T>[U]);
}

export class ServiceEventEmitter<T extends BaseModel> extends EventEmitter {
  public emit<U extends keyof ServiceEvents<T>>(
    event: U,
    ...args: Parameters<ServiceEvents<T>[U]>
  ) {
    super.emit(event, ...args);
  }

  public on<U extends keyof ServiceEvents<T>>(event: U, listener: ServiceEvents<T>[U]) {
    super.emit(event, listener);
  }
}

export class BaseService<T extends BaseModel> {
  private emitter: ServiceEventEmitter<T>;
  private Model: new (parameters: T) => T;

  constructor(emitter: ServiceEventEmitter<T>, Model: new (parameters: T) => T) {
    this.emitter = emitter;
    this.Model = Model;
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any, url: string): Promise<T[]> {
    const response = await request.promise(`${url}/count`, {
      json: true,
      method: 'get',
      qs: { query: JSON.stringify(query) },
    });

    return response.count;
  }

  /**
   * Creates a Record.
   */
  public async create(json: Partial<T>, url: string): Promise<T> {
    const response = await request.promise(url, { json, method: 'post' });

    const record = new this.Model(response.record);
    this.emitter.emit('create', record);

    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string, url: string): Promise<T> {
    this.emitter.emit('delete', _id);

    const response = await request.promise(`${url}/${_id}`, { json: true, method: 'delete' });

    const record = new this.Model(response.record);
    return record;
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any, url: string): Promise<T[]> {
    const response = await request.promise(url, {
      json: true,
      method: 'get',
      qs: { query: JSON.stringify(query) },
    });

    const records = response.records.map((r) => new this.Model(r));
    this.emitter.emit('set', records);

    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string, url: string): Promise<T> {
    const response = await request.promise(`${url}/${_id}`, { json: true, method: 'get' });

    const record = new this.Model(response.record);
    this.emitter.emit('set', [record]);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<T>, url: string): Promise<T> {
    const response = await request.promise(`${url}/${_id}`, { json, method: 'put' });

    const record = new this.Model(response.record);
    this.emitter.emit('update', record);

    return record;
  }
}
