import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Collection } from '../models/collection';
import { CollectionService } from '../services/collection/collection.service';

export interface CollectionState extends EntityState<Collection> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'collections', resettable: true })
export class CollectionStore extends EntityStore<CollectionState, Collection> {
  constructor(private collectionService: CollectionService) {
    super();

    this.collectionService.onCreate.subscribe(record => this.add(record));
    this.collectionService.onDelete.subscribe(record => this.remove(record._id));
    this.collectionService.onRead.subscribe(records => this.upsertMany(records));
    this.collectionService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class CollectionQuery extends QueryEntity<CollectionState, Collection> {
  constructor(protected store: CollectionStore) {
    super(store);
  }
}
