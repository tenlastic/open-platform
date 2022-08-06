import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { IgnorationModel } from '../models/ignoration';
import { UserQuery } from './user';

export interface IgnorationState extends EntityState<IgnorationModel> {}

@StoreConfig({ idKey: '_id', name: 'ignorations', resettable: true })
export class IgnorationStore extends EntityStore<IgnorationState, IgnorationModel> {}

export class IgnorationQuery extends QueryEntity<IgnorationState, IgnorationModel> {
  constructor(protected store: IgnorationStore, private userQuery: UserQuery) {
    super(store);
  }
}
