import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { DatabaseModel } from '../models/database';
import { databaseService } from '../services/database';

export interface DatabaseState extends EntityState<DatabaseModel> {}

@StoreConfig({ idKey: '_id', name: 'databases', resettable: true })
export class DatabaseStore extends EntityStore<DatabaseState, DatabaseModel> {
  constructor() {
    super();

    databaseService.emitter.on('create', record => this.add(record));
    databaseService.emitter.on('delete', _id => this.remove(_id));
    databaseService.emitter.on('set', records => this.upsertMany(records));
    databaseService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class DatabaseQuery extends QueryEntity<DatabaseState, DatabaseModel> {
  constructor(protected store: DatabaseStore) {
    super(store);
  }
}

export const databaseStore = new DatabaseStore();
export const databaseQuery = new DatabaseQuery(databaseStore);
