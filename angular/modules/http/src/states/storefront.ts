import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Storefront } from '../models/storefront';
import { StorefrontService } from '../services/storefront/storefront.service';

export interface StorefrontState extends EntityState<Storefront> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'storefronts', resettable: true })
export class StorefrontStore extends EntityStore<StorefrontState, Storefront> {
  constructor(private storefrontService: StorefrontService) {
    super();

    this.storefrontService.onCreate.subscribe((record) => this.add(record));
    this.storefrontService.onDelete.subscribe((record) => this.remove(record._id));
    this.storefrontService.onRead.subscribe((records) => this.upsertMany(records));
    this.storefrontService.onUpdate.subscribe((record) => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class StorefrontQuery extends QueryEntity<StorefrontState, Storefront> {
  constructor(protected store: StorefrontStore) {
    super(store);
  }
}
