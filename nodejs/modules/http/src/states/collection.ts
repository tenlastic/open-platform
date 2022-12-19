import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { CollectionModel } from '../models/collection';
import { BaseStore } from './base';

export interface CollectionState extends EntityState<CollectionModel> {}

@StoreConfig({ idKey: '_id', name: 'collections', resettable: true })
export class CollectionStore extends BaseStore<CollectionState, CollectionModel> {}

export class CollectionQuery extends QueryEntity<CollectionState, CollectionModel> {
  constructor(protected store: CollectionStore) {
    super(store);
  }
}
