import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupModel } from '../models/group';
import { BaseStore } from './base';

export interface GroupState extends EntityState<GroupModel> {}

@StoreConfig({ idKey: '_id', name: 'groups', resettable: true })
export class GroupStore extends BaseStore<GroupState, GroupModel> {}

export class GroupQuery extends QueryEntity<GroupState, GroupModel> {
  constructor(protected store: GroupStore) {
    super(store);
  }
}
