import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupModel } from '../models/group';
import { groupService } from '../services/group';

export interface GroupState extends EntityState<GroupModel> {}

@StoreConfig({ idKey: '_id', name: 'groups', resettable: true })
export class GroupStore extends EntityStore<GroupState, GroupModel> {
  constructor() {
    super();

    groupService.emitter.on('create', record => this.add(record));
    groupService.emitter.on('delete', _id => this.remove(_id));
    groupService.emitter.on('set', records => this.upsertMany(records));
    groupService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class GroupQuery extends QueryEntity<GroupState, GroupModel> {
  constructor(protected store: GroupStore) {
    super(store);
  }
}

export const groupStore = new GroupStore();
export const groupQuery = new GroupQuery(groupStore);
