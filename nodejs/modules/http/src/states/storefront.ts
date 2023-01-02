import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { StorefrontModel } from '../models/storefront';
import { BaseStore } from './base';

export interface StorefrontState extends EntityState<StorefrontModel> {}

@StoreConfig({
  idKey: 'namespaceId',
  deepFreezeFn: (o) => o,
  name: 'storefronts',
  resettable: true,
})
export class StorefrontStore extends BaseStore<StorefrontState, StorefrontModel> {}

export class StorefrontQuery extends QueryEntity<StorefrontState, StorefrontModel> {
  constructor(protected store: StorefrontStore) {
    super(store);
  }
}
