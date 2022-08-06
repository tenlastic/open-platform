import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildModel } from '../models/build';

export interface BuildState extends EntityState<BuildModel> {}

@StoreConfig({ idKey: '_id', name: 'builds', resettable: true })
export class BuildStore extends EntityStore<BuildState, BuildModel> {}

export class BuildQuery extends QueryEntity<BuildState, BuildModel> {
  constructor(protected store: BuildStore) {
    super(store);
  }
}
