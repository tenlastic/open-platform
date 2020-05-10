import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { User } from '../models/user';
import { UserService } from '../services/user/user.service';

export interface UserState extends EntityState<User> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'users' })
export class UserStore extends EntityStore<UserState, User> {
  constructor(private userService: UserService) {
    super();

    this.userService.onCreate.subscribe(record => this.add(record));
    this.userService.onDelete.subscribe(record => this.remove(record._id));
    this.userService.onRead.subscribe(records => this.add(records));
    this.userService.onUpdate.subscribe(record => this.replace(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class UserQuery extends QueryEntity<UserState, User> {
  constructor(protected store: UserStore) {
    super(store);
  }
}
