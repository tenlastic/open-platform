import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GroupInvitationModel } from '../models/group-invitation';

export interface GroupInvitationState extends EntityState<GroupInvitationModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'group-invitations', resettable: true })
export class GroupInvitationStore extends EntityStore<GroupInvitationState, GroupInvitationModel> {}

export class GroupInvitationQuery extends QueryEntity<GroupInvitationState, GroupInvitationModel> {
  constructor(protected store: GroupInvitationStore) {
    super(store);
  }
}
