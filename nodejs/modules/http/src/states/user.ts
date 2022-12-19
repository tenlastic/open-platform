import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { UserModel } from '../models/user';
import { BaseStore } from './base';

export interface UserState extends EntityState<UserModel> {}

@StoreConfig({ idKey: '_id', name: 'users', resettable: true })
export class UserStore extends BaseStore<UserState, UserModel> {}

export class UserQuery extends QueryEntity<UserState, UserModel> {
  constructor(protected store: UserStore) {
    super(store);
  }
}
