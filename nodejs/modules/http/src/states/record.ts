import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { RecordModel } from '../models/record';
import { BaseStore } from './base';

export interface RecordState extends EntityState<RecordModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'records', resettable: true })
export class RecordStore extends BaseStore<RecordState, RecordModel> {}

export class RecordQuery extends QueryEntity<RecordState, RecordModel> {
  constructor(protected store: RecordStore) {
    super(store);
  }
}
