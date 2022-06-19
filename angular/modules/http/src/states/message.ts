import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Message } from '../models/message';
import { MessageService } from '../services/message/message.service';
import { UserQuery } from './user';

export interface MessageState extends EntityState<Message> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'messages', resettable: true })
export class MessageStore extends EntityStore<MessageState, Message> {
  constructor(private messageService: MessageService) {
    super();

    this.messageService.onCreate.subscribe(record => this.add(record));
    this.messageService.onDelete.subscribe(record => this.remove(record._id));
    this.messageService.onRead.subscribe(records => this.upsertMany(records));
    this.messageService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class MessageQuery extends QueryEntity<MessageState, Message> {
  constructor(protected store: MessageStore, private userQuery: UserQuery) {
    super(store);
  }

  public populateUsers($input: Observable<Message[]>) {
    return combineLatest([$input, this.userQuery.selectAll({ asObject: true })]).pipe(
      map(([messages, users]) => {
        return messages.map(message => {
          return new Message({
            ...message,
            fromUser: users[message.fromUserId],
            toUser: users[message.toUserId],
          });
        });
      }),
    );
  }

  public selectAllInConversation(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: m =>
        [m.fromUserId, m.toUserId].sort().toString() === [fromUserId, toUserId].sort().toString(),
      sortBy: 'createdAt',
    });
  }

  public selectAllInGroup(groupId: string) {
    return this.selectAll({
      filterBy: m => m.toGroupId === groupId,
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadInConversation(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: m =>
        !m.readByUserIds.includes(fromUserId) &&
        [m.fromUserId, m.toUserId].sort().toString() === [fromUserId, toUserId].sort().toString(),
      sortBy: 'createdAt',
    });
  }

  public selectAllUnreadInGroup(groupId: string, userId) {
    return this.selectAll({
      filterBy: m => m.toGroupId === groupId && !m.readByUserIds.includes(userId),
      sortBy: 'createdAt',
    });
  }
}
