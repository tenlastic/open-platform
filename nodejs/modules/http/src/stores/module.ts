import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { ModuleModel } from '../models/module';
import { moduleService } from '../services/module';

export interface ModuleState extends EntityState<ModuleModel> {}

@StoreConfig({ idKey: '_id', name: 'modules', resettable: true })
export class ModuleStore extends EntityStore<ModuleState, ModuleModel> {
  constructor() {
    super();

    moduleService.emitter.on('create', (record) => this.add(record));
    moduleService.emitter.on('delete', (_id) => this.remove(_id));
    moduleService.emitter.on('set', (records) => this.upsertMany(records));
    moduleService.emitter.on('update', (record) => this.upsert(record._id, record));
  }
}

export class ModuleQuery extends QueryEntity<ModuleState, ModuleModel> {
  constructor(protected store: ModuleStore) {
    super(store);
  }
}

export const moduleStore = new ModuleStore();
export const moduleQuery = new ModuleQuery(moduleStore);
