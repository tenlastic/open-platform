import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceLogModel } from '../models/namespace-log';

export interface NamespaceLogState extends EntityState<NamespaceLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'namespace-logs', resettable: true })
export class NamespaceLogStore extends EntityStore<NamespaceLogState, NamespaceLogModel> {}

export class NamespaceLogQuery extends QueryEntity<NamespaceLogState, NamespaceLogModel> {
  constructor(protected store: NamespaceLogStore) {
    super(store);
  }
}
