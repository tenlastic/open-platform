import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { NamespaceLogModel } from '../models/namespace-log';
import { BaseStore } from './base';

export interface NamespaceLogState extends EntityState<NamespaceLogModel> {}

@StoreConfig({ idKey: 'unix', deepFreezeFn: (o) => o, name: 'namespace-logs', resettable: true })
export class NamespaceLogStore extends BaseStore<NamespaceLogState, NamespaceLogModel> {}

export class NamespaceLogQuery extends QueryEntity<NamespaceLogState, NamespaceLogModel> {
  constructor(protected store: NamespaceLogStore) {
    super(store);
  }
}
