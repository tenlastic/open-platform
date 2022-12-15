import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupModel } from '../models/group';

export interface GroupState extends EntityState<GroupModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'groups', resettable: true })
export class GroupStore extends EntityStore<GroupState, GroupModel> {}

export class GroupQuery extends QueryEntity<GroupState, GroupModel> {
  constructor(protected store: GroupStore) {
    super(store);
  }
}
