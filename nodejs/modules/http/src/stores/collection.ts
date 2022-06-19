import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { CollectionModel } from '../models/collection';
import { collectionService } from '../services/collection';

export interface CollectionState extends EntityState<CollectionModel> {}

@StoreConfig({ idKey: '_id', name: 'collections', resettable: true })
export class CollectionStore extends EntityStore<CollectionState, CollectionModel> {
  constructor() {
    super();

    collectionService.emitter.on('create', record => this.add(record));
    collectionService.emitter.on('delete', _id => this.remove(_id));
    collectionService.emitter.on('set', records => this.upsertMany(records));
    collectionService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class CollectionQuery extends QueryEntity<CollectionState, CollectionModel> {
  constructor(protected store: CollectionStore) {
    super(store);
  }
}

export const collectionStore = new CollectionStore();
export const collectionQuery = new CollectionQuery(collectionStore);
