import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceModel } from '../models/namespace';
import { namespaceService } from '../services/namespace';

export interface NamespaceState extends EntityState<NamespaceModel> {}

@StoreConfig({ idKey: '_id', name: 'namespaces', resettable: true })
export class NamespaceStore extends EntityStore<NamespaceState, NamespaceModel> {
  constructor() {
    super();

    namespaceService.emitter.on('create', record => this.add(record));
    namespaceService.emitter.on('delete', _id => this.remove(_id));
    namespaceService.emitter.on('set', records => this.upsertMany(records));
    namespaceService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class NamespaceQuery extends QueryEntity<NamespaceState, NamespaceModel> {
  constructor(protected store: NamespaceStore) {
    super(store);
  }
}

export const namespaceStore = new NamespaceStore();
export const namespaceQuery = new NamespaceQuery(namespaceStore);
