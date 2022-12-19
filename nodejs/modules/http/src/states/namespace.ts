import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceModel } from '../models/namespace';
import { BaseStore } from './base';

export interface NamespaceState extends EntityState<NamespaceModel> {}

@StoreConfig({ idKey: '_id', name: 'namespaces', resettable: true })
export class NamespaceStore extends BaseStore<NamespaceState, NamespaceModel> {}

export class NamespaceQuery extends QueryEntity<NamespaceState, NamespaceModel> {
  constructor(protected store: NamespaceStore) {
    super(store);
  }
}
