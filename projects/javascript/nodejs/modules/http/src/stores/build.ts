import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildModel } from '../models/build';
import { buildService } from '../services/build';

export interface BuildState extends EntityState<BuildModel> {}

@StoreConfig({ idKey: '_id', name: 'builds', resettable: true })
export class BuildStore extends EntityStore<BuildState, BuildModel> {
  constructor() {
    super();

    buildService.emitter.on('create', record => this.add(record));
    buildService.emitter.on('delete', _id => this.remove(_id));
    buildService.emitter.on('set', records => this.upsertMany(records));
    buildService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class BuildQuery extends QueryEntity<BuildState, BuildModel> {
  constructor(protected store: BuildStore) {
    super(store);
  }
}

export const buildStore = new BuildStore();
export const buildQuery = new BuildQuery(buildStore);
