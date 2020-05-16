import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GroupInvitation } from '../models/group-invitation';
import { GroupInvitationService } from '../services/group-invitation/group-invitation.service';
import { GroupQuery } from './group';
import { UserQuery } from './user';

export interface GroupInvitationState extends EntityState<GroupInvitation> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'group-invitations' })
export class GroupInvitationStore extends EntityStore<GroupInvitationState, GroupInvitation> {
  constructor(private groupInvitationService: GroupInvitationService) {
    super();

    this.groupInvitationService.onCreate.subscribe(record => this.add(record));
    this.groupInvitationService.onDelete.subscribe(record => this.remove(record._id));
    this.groupInvitationService.onRead.subscribe(records => this.add(records));
    this.groupInvitationService.onUpdate.subscribe(record => this.replace(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GroupInvitationQuery extends QueryEntity<GroupInvitationState, GroupInvitation> {
  constructor(
    private groupQuery: GroupQuery,
    protected store: GroupInvitationStore,
    private userQuery: UserQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<GroupInvitation[]>) {
    return combineLatest([
      $input,
      this.groupQuery.selectAll({ asObject: true }),
      this.userQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([groupInvitations, groups, users]) => {
        return groupInvitations.map(groupInvitation => {
          return new GroupInvitation({
            ...groupInvitation,
            fromUser: users[groupInvitation.fromUserId],
            group: groups[groupInvitation.groupId],
            toUser: users[groupInvitation.toUserId],
          });
        });
      }),
    );
  }
}
