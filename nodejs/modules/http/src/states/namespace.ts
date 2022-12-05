import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceModel } from '../models/namespace';

export interface NamespaceState extends EntityState<NamespaceModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'namespaces', resettable: true })
export class NamespaceStore extends EntityStore<NamespaceState, NamespaceModel> {}

export class NamespaceQuery extends QueryEntity<NamespaceState, NamespaceModel> {
  constructor(protected store: NamespaceStore) {
    super(store);
  }
}
