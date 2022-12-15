import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { MatchInvitationModel } from '../models/match-invitation';

export interface MatchInvitationState extends EntityState<MatchInvitationModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'match-invitations', resettable: true })
export class MatchInvitationStore extends EntityStore<MatchInvitationState, MatchInvitationModel> {}

export class MatchInvitationQuery extends QueryEntity<MatchInvitationState, MatchInvitationModel> {
  constructor(protected store: MatchInvitationStore) {
    super(store);
  }
}
