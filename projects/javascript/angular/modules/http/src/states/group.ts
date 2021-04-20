import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Group } from '../models/group';
import { GroupService } from '../services/group/group.service';
import { UserQuery } from '../states/user';

export interface GroupState extends EntityState<Group> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'groups', resettable: true })
export class GroupStore extends EntityStore<GroupState, Group> {
  constructor(private groupService: GroupService) {
    super();

    this.groupService.onCreate.subscribe(record => this.add(record));
    this.groupService.onDelete.subscribe(record => this.remove(record._id));
    this.groupService.onRead.subscribe(records => this.upsertMany(records));
    this.groupService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GroupQuery extends QueryEntity<GroupState, Group> {
  constructor(protected store: GroupStore, private userQuery: UserQuery) {
    super(store);
  }

  public populate($input: Observable<Group[]>) {
    return combineLatest([$input, this.userQuery.selectAll({ asObject: true })]).pipe(
      map(([groups, users]) => {
        return groups.map(group => {
          return new Group({
            ...group,
            users: group.userIds.map(userId => users[userId]).filter(user => user),
          });
        });
      }),
    );
  }
}
