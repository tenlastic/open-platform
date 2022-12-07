import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { MatchModel } from '../models/match';

export interface MatchState extends EntityState<MatchModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'matches', resettable: true })
export class MatchStore extends EntityStore<MatchState, MatchModel> {}

export class MatchQuery extends QueryEntity<MatchState, MatchModel> {
  constructor(protected store: MatchStore) {
    super(store);
  }
}
