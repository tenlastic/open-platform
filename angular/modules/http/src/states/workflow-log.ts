import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WorkflowLog } from '../models/workflow-log';
import { WorkflowService } from '../services/workflow/workflow.service';

export interface WorkflowLogState extends EntityState<WorkflowLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'workflow-logs', resettable: true })
export class WorkflowLogStore extends EntityStore<WorkflowLogState, WorkflowLog> {
  constructor(private workflowService: WorkflowService) {
    super();

    this.workflowService.onLogs.subscribe(records => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class WorkflowLogQuery extends QueryEntity<WorkflowLogState, WorkflowLog> {
  constructor(protected store: WorkflowLogStore) {
    super(store);
  }
}
