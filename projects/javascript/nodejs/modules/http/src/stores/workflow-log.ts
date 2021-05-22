import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowLogModel } from '../models/workflow-log';
import { workflowLogService } from '../services/workflow-log';

export interface WorkflowLogState extends EntityState<WorkflowLogModel> {}

@StoreConfig({ idKey: '_id', name: 'workflow-logs', resettable: true })
export class WorkflowLogStore extends EntityStore<WorkflowLogState, WorkflowLogModel> {
  constructor() {
    super();

    workflowLogService.emitter.on('create', record => this.add(record));
    workflowLogService.emitter.on('delete', _id => this.remove(_id));
    workflowLogService.emitter.on('set', records => this.upsertMany(records));
    workflowLogService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class WorkflowLogQuery extends QueryEntity<WorkflowLogState, WorkflowLogModel> {
  constructor(protected store: WorkflowLogStore) {
    super(store);
  }
}

export const workflowLogStore = new WorkflowLogStore();
export const workflowLogQuery = new WorkflowLogQuery(workflowLogStore);
