import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceLog } from '../models/namespace-log';
import { NamespaceService } from '../services/namespace/namespace.service';

export interface NamespaceLogState extends EntityState<NamespaceLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'namespace-logs', resettable: true })
export class NamespaceLogStore extends EntityStore<NamespaceLogState, NamespaceLog> {
  constructor(private namespaceService: NamespaceService) {
    super();

    this.namespaceService.onLogs.subscribe((records) => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class NamespaceLogQuery extends QueryEntity<NamespaceLogState, NamespaceLog> {
  constructor(protected store: NamespaceLogStore) {
    super(store);
  }
}
