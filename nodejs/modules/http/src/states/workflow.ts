import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowModel } from '../models/workflow';

export interface WorkflowState extends EntityState<WorkflowModel> {}

@StoreConfig({ idKey: '_id', name: 'workflows', resettable: true })
export class WorkflowStore extends EntityStore<WorkflowState, WorkflowModel> {}

export class WorkflowQuery extends QueryEntity<WorkflowState, WorkflowModel> {
  constructor(protected store: WorkflowStore) {
    super(store);
  }
}
