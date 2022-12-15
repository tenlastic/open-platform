import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { RefreshTokenModel } from '../models/refresh-token';

export interface RefreshTokenState extends EntityState<RefreshTokenModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'refreshtokens', resettable: true })
export class RefreshTokenStore extends EntityStore<RefreshTokenState, RefreshTokenModel> {}

export class RefreshTokenQuery extends QueryEntity<RefreshTokenState, RefreshTokenModel> {
  constructor(protected store: RefreshTokenStore) {
    super(store);
  }
}
