import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { RecordModel } from '../models/record';
import { recordService } from '../services/record';

export interface RecordState extends EntityState<RecordModel> {}

@StoreConfig({ idKey: '_id', name: 'records', resettable: true })
export class RecordStore extends EntityStore<RecordState, RecordModel> {
  constructor() {
    super();

    recordService.emitter.on('create', record => this.add(record));
    recordService.emitter.on('delete', _id => this.remove(_id));
    recordService.emitter.on('set', records => this.upsertMany(records));
    recordService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class RecordQuery extends QueryEntity<RecordState, RecordModel> {
  constructor(protected store: RecordStore) {
    super(store);
  }
}

export const recordStore = new RecordStore();
export const recordQuery = new RecordQuery(recordStore);
