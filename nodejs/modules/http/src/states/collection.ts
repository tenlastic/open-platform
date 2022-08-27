import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { CollectionModel } from '../models/collection';

export interface CollectionState extends EntityState<CollectionModel> {}

@StoreConfig({ idKey: '_id', name: 'collections', resettable: true })
export class CollectionStore extends EntityStore<CollectionState, CollectionModel> {}

export class CollectionQuery extends QueryEntity<CollectionState, CollectionModel> {
  constructor(protected store: CollectionStore) {
    super(store);
  }
}