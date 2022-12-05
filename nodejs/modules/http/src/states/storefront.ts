import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { StorefrontModel } from '../models/storefront';

export interface StorefrontState extends EntityState<StorefrontModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'storefronts', resettable: true })
export class StorefrontStore extends EntityStore<StorefrontState, StorefrontModel> {}

export class StorefrontQuery extends QueryEntity<StorefrontState, StorefrontModel> {
  constructor(protected store: StorefrontStore) {
    super(store);
  }
}
