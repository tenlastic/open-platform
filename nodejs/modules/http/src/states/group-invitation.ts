import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupInvitationModel } from '../models/group-invitation';
import { BaseStore } from './base';

export interface GroupInvitationState extends EntityState<GroupInvitationModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'group-invitations', resettable: true })
export class GroupInvitationStore extends BaseStore<GroupInvitationState, GroupInvitationModel> {}

export class GroupInvitationQuery extends QueryEntity<GroupInvitationState, GroupInvitationModel> {
  constructor(protected store: GroupInvitationStore) {
    super(store);
  }
}
