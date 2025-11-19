import TypedEmitter from 'typed-emitter';

import { BaseModel } from '../models';
import { ServiceEvents } from '../services/base';
import { State } from '../state';

export interface BaseStateService<TModel extends BaseModel> {
  emitter: TypedEmitter<ServiceEvents<TModel>>;
}

export class BaseState<
  TModel extends BaseModel,
  TService extends BaseStateService<TModel>,
> extends State<TModel> {
  constructor(key: keyof TModel, service: TService) {
    super(key);

    service.emitter.on('create', (r) => this.upsertMany([r]));
    service.emitter.on('delete', (r) => this.removeOne(r._id));
    service.emitter.on('find', (rs) => this.upsertMany(rs));
    service.emitter.on('update', (r) => this.upsertMany([r]));
  }
}
