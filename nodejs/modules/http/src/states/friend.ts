import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { FriendModel } from '../models/friend';
import { BaseStore } from './base';
import { UserQuery } from './user';

export interface FriendState extends EntityState<FriendModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'friends', resettable: true })
export class FriendStore extends BaseStore<FriendState, FriendModel> {}

export class FriendQuery extends QueryEntity<FriendState, FriendModel> {
  constructor(protected store: FriendStore, private userQuery: UserQuery) {
    super(store);
  }
}
