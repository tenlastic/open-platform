import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { UserModel } from '../models/user';

export interface UserState extends EntityState<UserModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'users', resettable: true })
export class UserStore extends EntityStore<UserState, UserModel> {}

export class UserQuery extends QueryEntity<UserState, UserModel> {
  constructor(protected store: UserStore) {
    super(store);
  }
}
