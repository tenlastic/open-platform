import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Connection } from '../models/connection';
import { ConnectionService } from '../services/connection/connection.service';

export interface ConnectionState extends EntityState<Connection> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'connections' })
export class ConnectionStore extends EntityStore<ConnectionState, Connection> {
  constructor(private connectionService: ConnectionService) {
    super();

    this.connectionService.onCreate.subscribe(record => this.add(record));
    this.connectionService.onDelete.subscribe(record => this.remove(record._id));
    this.connectionService.onRead.subscribe(records => this.upsertMany(records));
    this.connectionService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class ConnectionQuery extends QueryEntity<ConnectionState, Connection> {
  constructor(protected store: ConnectionStore) {
    super(store);
  }
}
