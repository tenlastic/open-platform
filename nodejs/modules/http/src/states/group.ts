import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupModel } from '../models/group';
import { UserQuery } from '../states/user';

export interface GroupState extends EntityState<GroupModel> {}

@StoreConfig({ idKey: '_id', name: 'groups', resettable: true })
export class GroupStore extends EntityStore<GroupState, GroupModel> {}

export class GroupQuery extends QueryEntity<GroupState, GroupModel> {
  constructor(protected store: GroupStore, private userQuery: UserQuery) {
    super(store);
  }
}
