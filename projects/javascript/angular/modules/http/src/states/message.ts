import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Message } from '../models/message';
import { MessageService } from '../services/message/message.service';
import { UserQuery } from './user';

export interface MessageState extends EntityState<Message> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'messages' })
export class MessageStore extends EntityStore<MessageState, Message> {
  constructor(private messageService: MessageService) {
    super();

    this.messageService.onCreate.subscribe(record => this.add(record));
    this.messageService.onDelete.subscribe(record => this.remove(record._id));
    this.messageService.onRead.subscribe(records => this.add(records));
    this.messageService.onUpdate.subscribe(record => this.replace(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class MessageQuery extends QueryEntity<MessageState, Message> {
  constructor(protected store: MessageStore, private userQuery: UserQuery) {
    super(store);
  }

  public populateUsers($input: Observable<Message[]>) {
    return combineLatest([$input, this.userQuery.selectAll()]).pipe(
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

  public selectAllUnread(fromUserId: string, toUserId: string) {
    return this.selectAll({
      filterBy: m => !m.readAt && m.fromUserId === fromUserId && m.toUserId === toUserId,
      sortBy: 'createdAt',
    });
  }
}
