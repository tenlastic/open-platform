import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { QueueMember } from '../models/queue-member';
import { QueueMemberService } from '../services/queue-member/queue-member.service';
import { QueueQuery } from './queue';
import { UserQuery } from './user';

export interface QueueMemberState extends EntityState<QueueMember> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'queue-members', resettable: true })
export class QueueMemberStore extends EntityStore<QueueMemberState, QueueMember> {
  constructor(private queueMemberService: QueueMemberService) {
    super();

    this.queueMemberService.onCreate.subscribe(record => this.add(record));
    this.queueMemberService.onDelete.subscribe(record => this.remove(record._id));
    this.queueMemberService.onRead.subscribe(records => this.upsertMany(records));
    this.queueMemberService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class QueueMemberQuery extends QueryEntity<QueueMemberState, QueueMember> {
  constructor(
    private queueQuery: QueueQuery,
    protected store: QueueMemberStore,
    private userQuery: UserQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<QueueMember[]>) {
    return combineLatest([
      $input,
      this.queueQuery.selectAll({ asObject: true }),
      this.userQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([queueMembers, queues, users]) => {
        return queueMembers.map(queueMember => {
          return new QueueMember({
            ...queueMember,
            queue: queues[queueMember.queueId],
            user: users[queueMember.userId],
          });
        });
      }),
    );
  }
}
