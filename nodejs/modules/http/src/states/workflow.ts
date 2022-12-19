import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowModel } from '../models/workflow';
import { BaseStore } from './base';

export interface WorkflowState extends EntityState<WorkflowModel> {}

@StoreConfig({ idKey: '_id', name: 'workflows', resettable: true })
export class WorkflowStore extends BaseStore<WorkflowState, WorkflowModel> {}

export class WorkflowQuery extends QueryEntity<WorkflowState, WorkflowModel> {
  constructor(protected store: WorkflowStore) {
    super(store);
  }
}
