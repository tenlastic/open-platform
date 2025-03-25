import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { TeamModel } from '../models/team';
import { BaseStore } from './base';

export interface TeamState extends EntityState<TeamModel> {}

@StoreConfig({
  idKey: '_id',
  deepFreezeFn: (o) => o,
  name: 'teams',
  resettable: true,
})
export class TeamStore extends BaseStore<TeamState, TeamModel> {}

export class TeamQuery extends QueryEntity<TeamState, TeamModel> {
  constructor(protected store: TeamStore) {
    super(store);
  }
}
