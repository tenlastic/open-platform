import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Namespace } from '../models/namespace';
import { NamespaceService } from '../services/namespace/namespace.service';
import { UserQuery } from './user';

export interface NamespaceState extends EntityState<Namespace> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'namespaces', resettable: true })
export class NamespaceStore extends EntityStore<NamespaceState, Namespace> {
  constructor(private namespaceService: NamespaceService) {
    super();

    this.namespaceService.onCreate.subscribe(record => this.add(record));
    this.namespaceService.onDelete.subscribe(record => this.remove(record._id));
    this.namespaceService.onRead.subscribe(records => this.upsertMany(records));
    this.namespaceService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class NamespaceQuery extends QueryEntity<NamespaceState, Namespace> {
  constructor(protected store: NamespaceStore, private userQuery: UserQuery) {
    super(store);
  }
}
