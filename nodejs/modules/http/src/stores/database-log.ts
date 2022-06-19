import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { DatabaseLogModel } from '../models/database-log';
import { databaseLogService } from '../services/database-log';

export interface DatabaseLogState extends EntityState<DatabaseLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'database-logs', resettable: true })
export class DatabaseLogStore extends EntityStore<DatabaseLogState, DatabaseLogModel> {
  constructor() {
    super();

    databaseLogService.emitter.on('create', record => this.add(record));
    databaseLogService.emitter.on('delete', _id => this.remove(_id));
    databaseLogService.emitter.on('set', records => this.upsertMany(records));
    databaseLogService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class DatabaseLogQuery extends QueryEntity<DatabaseLogState, DatabaseLogModel> {
  constructor(protected store: DatabaseLogStore) {
    super(store);
  }
}

export const databaseLogStore = new DatabaseLogStore();
export const databaseLogQuery = new DatabaseLogQuery(databaseLogStore);
