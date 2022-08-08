import { EntityState, EntityStore } from '@datorama/akita';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { BaseModel } from '../models/base';
import { ApiService } from './api/api';

export class ServiceEventEmitter<T extends BaseModel> extends EventEmitter {
  public emit<U extends keyof ServiceEvents<T>>(
    event: U,
    ...args: Parameters<ServiceEvents<T>[U]>
  ) {
    super.emit(event, ...args);
  }

  public on<U extends keyof ServiceEvents<T>>(event: U, listener: ServiceEvents<T>[U]) {
    super.on(event, listener);
  }
}

export declare interface ServiceEventEmitter<T extends BaseModel> {
  emit<U extends keyof ServiceEvents<T>>(event: U, ...args: Parameters<ServiceEvents<T>[U]>);
  on<U extends keyof ServiceEvents<T>>(event: U, listener: ServiceEvents<T>[U]);
}

export interface BaseServiceFindQuery {
  limit?: number;
  select?: string | string[];
  skip?: number;
  sort?: string;
  where?: any;
}

export type ServiceEvents<T extends BaseModel> = {
  create: (record: T) => void;
  delete: (record: T) => void;
  update: (record: T) => void;
};

export class BaseService<T extends BaseModel> {
  public get emitter() {
    return this._emitter;
  }

  private _emitter = new EventEmitter() as TypedEmitter<ServiceEvents<T>>;
  private apiService: ApiService;
  private Model: new (parameters: T) => T;
  private store: EntityStore<EntityState<T>, T>;

  constructor(
    apiService: ApiService,
    Model: new (parameters: T) => T,
    store: EntityStore<EntityState<T>, T>,
  ) {
    this.apiService = apiService;
    this.Model = Model;
    this.store = store;
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any, url: string): Promise<number> {
    const response = await this.apiService.request({ method: 'get', params: query, url });
    return response.data.count;
  }

  /**
   * Creates a Record.
   */
  public async create(json: Partial<T>, url: string): Promise<T> {
    const response = await this.apiService.request({ data: json, method: 'post', url });

    const record = new this.Model(response.data.record);
    this.emitter.emit('create', record);
    this.store.add(record);

    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string, url: string): Promise<T> {
    const response = await this.apiService.request({ method: 'delete', url: `${url}/${_id}` });

    const record = new this.Model(response.data.record);
    this.emitter.emit('delete', record);
    this.store.remove(_id);

    return record;
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: BaseServiceFindQuery, url: string): Promise<T[]> {
    const response = await this.apiService.request({ method: 'get', params: query, url });

    const records = response.data.records.map((r) => new this.Model(r));
    this.store.upsertMany(records);

    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string, url: string): Promise<T> {
    const response = await this.apiService.request({ method: 'get', url: `${url}/${_id}` });

    const record = new this.Model(response.data.record);
    this.store.upsert(_id, record);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<T>, url: string): Promise<T> {
    const response = await this.apiService.request({
      data: json,
      method: 'put',
      url: `${url}/${_id}`,
    });

    const record = new this.Model(response.data.record);
    this.emitter.emit('update', record);
    this.store.upsert(_id, record);

    return record;
  }
}
