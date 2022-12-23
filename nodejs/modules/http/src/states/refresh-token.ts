import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { RefreshTokenModel } from '../models/refresh-token';
import { BaseStore } from './base';

export interface RefreshTokenState extends EntityState<RefreshTokenModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'refreshtokens', resettable: true })
export class RefreshTokenStore extends BaseStore<RefreshTokenState, RefreshTokenModel> {}

export class RefreshTokenQuery extends QueryEntity<RefreshTokenState, RefreshTokenModel> {
  constructor(protected store: RefreshTokenStore) {
    super(store);
  }
}
