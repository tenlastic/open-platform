import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { FriendModel } from '../models/friend';
import { UserQuery } from './user';

export interface FriendState extends EntityState<FriendModel> {}

@StoreConfig({ idKey: '_id', name: 'friends', resettable: true })
export class FriendStore extends EntityStore<FriendState, FriendModel> {}

export class FriendQuery extends QueryEntity<FriendState, FriendModel> {
  constructor(protected store: FriendStore, private userQuery: UserQuery) {
    super(store);
  }
}
