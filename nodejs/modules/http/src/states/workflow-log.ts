import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowLogModel } from '../models/workflow-log';

export interface WorkflowLogState extends EntityState<WorkflowLogModel> {}

@StoreConfig({ idKey: 'unix', deepFreezeFn: (o) => o, name: 'workflow-logs', resettable: true })
export class WorkflowLogStore extends EntityStore<WorkflowLogState, WorkflowLogModel> {}

export class WorkflowLogQuery extends QueryEntity<WorkflowLogState, WorkflowLogModel> {
  constructor(protected store: WorkflowLogStore) {
    super(store);
  }
}
