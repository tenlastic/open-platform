import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildLogModel } from '../models/build-log';

export interface BuildLogState extends EntityState<BuildLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'build-logs', resettable: true })
export class BuildLogStore extends EntityStore<BuildLogState, BuildLogModel> {}

export class BuildLogQuery extends QueryEntity<BuildLogState, BuildLogModel> {
  constructor(protected store: BuildLogStore) {
    super(store);
  }
}
