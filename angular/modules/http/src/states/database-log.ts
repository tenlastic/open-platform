import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { DatabaseLog } from '../models/database-log';
import { DatabaseService } from '../services/database/database.service';

export interface DatabaseLogState extends EntityState<DatabaseLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'database-logs', resettable: true })
export class DatabaseLogStore extends EntityStore<DatabaseLogState, DatabaseLog> {
  constructor(private databaseService: DatabaseService) {
    super();

    this.databaseService.onLogs.subscribe(records => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseLogQuery extends QueryEntity<DatabaseLogState, DatabaseLog> {
  constructor(protected store: DatabaseLogStore) {
    super(store);
  }
}
