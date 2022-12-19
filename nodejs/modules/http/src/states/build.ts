import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildModel } from '../models/build';
import { BaseStore } from './base';

export interface BuildState extends EntityState<BuildModel> {}

@StoreConfig({ idKey: '_id', name: 'builds', resettable: true })
export class BuildStore extends BaseStore<BuildState, BuildModel> {}

export class BuildQuery extends QueryEntity<BuildState, BuildModel> {
  constructor(protected store: BuildStore) {
    super(store);
  }
}
