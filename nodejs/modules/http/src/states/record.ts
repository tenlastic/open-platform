import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { RecordModel } from '../models/record';

export interface RecordState extends EntityState<RecordModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'records', resettable: true })
export class RecordStore extends EntityStore<RecordState, RecordModel> {}

export class RecordQuery extends QueryEntity<RecordState, RecordModel> {
  constructor(protected store: RecordStore) {
    super(store);
  }
}
