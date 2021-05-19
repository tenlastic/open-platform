import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { UserModel } from '../models/user';
import { userService } from '../services/user';

export interface UserState extends EntityState<UserModel> {}

@StoreConfig({ idKey: '_id', name: 'users', resettable: true })
export class UserStore extends EntityStore<UserState, UserModel> {
  constructor() {
    super();

    userService.emitter.on('create', record => this.add(record));
    userService.emitter.on('delete', _id => this.remove(_id));
    userService.emitter.on('set', records => this.upsertMany(records));
    userService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class UserQuery extends QueryEntity<UserState, UserModel> {
  constructor(protected store: UserStore) {
    super(store);
  }
}

export const userStore = new UserStore();
export const userQuery = new UserQuery(userStore);
