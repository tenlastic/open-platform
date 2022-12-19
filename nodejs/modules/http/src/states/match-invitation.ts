import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { MatchInvitationModel } from '../models/match-invitation';
import { BaseStore } from './base';

export interface MatchInvitationState extends EntityState<MatchInvitationModel> {}

@StoreConfig({ idKey: '_id', name: 'match-invitations', resettable: true })
export class MatchInvitationStore extends BaseStore<MatchInvitationState, MatchInvitationModel> {}

export class MatchInvitationQuery extends QueryEntity<MatchInvitationState, MatchInvitationModel> {
  constructor(protected store: MatchInvitationStore) {
    super(store);
  }
}
