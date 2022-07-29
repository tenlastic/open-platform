import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { StorefrontModel } from '../models/storefront';
import { storefrontService } from '../services/storefront';

export interface StorefrontState extends EntityState<StorefrontModel> {}

@StoreConfig({ idKey: '_id', name: 'storefronts', resettable: true })
export class StorefrontStore extends EntityStore<StorefrontState, StorefrontModel> {
  constructor() {
    super();

    storefrontService.emitter.on('create', (record) => this.add(record));
    storefrontService.emitter.on('delete', (_id) => this.remove(_id));
    storefrontService.emitter.on('set', (records) => this.upsertMany(records));
    storefrontService.emitter.on('update', (record) => this.upsert(record._id, record));
  }
}

export class StorefrontQuery extends QueryEntity<StorefrontState, StorefrontModel> {
  constructor(protected store: StorefrontStore) {
    super(store);
  }
}

export const storefrontStore = new StorefrontStore();
export const storefrontQuery = new StorefrontQuery(storefrontStore);
