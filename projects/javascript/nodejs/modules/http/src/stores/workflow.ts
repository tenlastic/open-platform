import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowModel } from '../models/workflow';
import { workflowService } from '../services/workflow';

export interface WorkflowState extends EntityState<WorkflowModel> {}

@StoreConfig({ idKey: '_id', name: 'workflows', resettable: true })
export class WorkflowStore extends EntityStore<WorkflowState, WorkflowModel> {
  constructor() {
    super();

    workflowService.emitter.on('create', record => this.add(record));
    workflowService.emitter.on('delete', _id => this.remove(_id));
    workflowService.emitter.on('set', records => this.upsertMany(records));
    workflowService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class WorkflowQuery extends QueryEntity<WorkflowState, WorkflowModel> {
  constructor(protected store: WorkflowStore) {
    super(store);
  }
}

export const workflowStore = new WorkflowStore();
export const workflowQuery = new WorkflowQuery(workflowStore);
