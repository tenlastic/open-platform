import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildLogModel } from '../models/build-log';
import { BaseStore } from './base';

export interface BuildLogState extends EntityState<BuildLogModel> {}

@StoreConfig({ idKey: 'unix', deepFreezeFn: (o) => o, name: 'build-logs', resettable: true })
export class BuildLogStore extends BaseStore<BuildLogState, BuildLogModel> {}

export class BuildLogQuery extends QueryEntity<BuildLogState, BuildLogModel> {
  constructor(protected store: BuildLogStore) {
    super(store);
  }
}
