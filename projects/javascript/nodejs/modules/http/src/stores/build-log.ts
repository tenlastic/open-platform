import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildLogModel } from '../models/build-log';
import { buildLogService } from '../services/build-log';

export interface BuildLogState extends EntityState<BuildLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'build-logs', resettable: true })
export class BuildLogStore extends EntityStore<BuildLogState, BuildLogModel> {
  constructor() {
    super();

    buildLogService.emitter.on('create', record => this.add(record));
    buildLogService.emitter.on('delete', _id => this.remove(_id));
    buildLogService.emitter.on('set', records => this.upsertMany(records));
    buildLogService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class BuildLogQuery extends QueryEntity<BuildLogState, BuildLogModel> {
  constructor(protected store: BuildLogStore) {
    super(store);
  }
}

export const buildLogStore = new BuildLogStore();
export const buildLogQuery = new BuildLogQuery(buildLogStore);
