import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { MatchModel } from '../models/match';
import { BaseStore } from './base';

export interface MatchState extends EntityState<MatchModel> {}

@StoreConfig({ idKey: '_id', name: 'matches', resettable: true })
export class MatchStore extends BaseStore<MatchState, MatchModel> {}

export class MatchQuery extends QueryEntity<MatchState, MatchModel> {
  constructor(protected store: MatchStore) {
    super(store);
  }
}
