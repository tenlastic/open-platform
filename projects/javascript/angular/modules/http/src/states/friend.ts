import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Friend } from '../models/friend';
import { FriendService } from '../services/friend/friend.service';
import { UserQuery } from './user';

export interface FriendState extends EntityState<Friend> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'friends' })
export class FriendStore extends EntityStore<FriendState, Friend> {
  constructor(private friendService: FriendService) {
    super();

    this.friendService.onCreate.subscribe(record => this.add(record));
    this.friendService.onDelete.subscribe(record => this.remove(record._id));
    this.friendService.onRead.subscribe(records => this.upsertMany(records));
    this.friendService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class FriendQuery extends QueryEntity<FriendState, Friend> {
  constructor(protected store: FriendStore, private userQuery: UserQuery) {
    super(store);
  }

  public populateUsers($input: Observable<Friend[]>) {
    return combineLatest([$input, this.userQuery.selectAll({ asObject: true })]).pipe(
      map(([friends, users]) => {
        return friends.map(friend => {
          return new Friend({
            ...friend,
            fromUser: users[friend.fromUserId],
            toUser: users[friend.toUserId],
          });
        });
      }),
    );
  }
}
