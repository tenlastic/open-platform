import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Workflow } from '../models/workflow';
import { WorkflowService } from '../services/workflow/workflow.service';

export interface WorkflowState extends EntityState<Workflow> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'workflows', resettable: true })
export class WorkflowStore extends EntityStore<WorkflowState, Workflow> {
  constructor(private workflowService: WorkflowService) {
    super();

    this.workflowService.onCreate.subscribe(record => this.add(record));
    this.workflowService.onDelete.subscribe(record => this.remove(record._id));
    this.workflowService.onRead.subscribe(records => this.upsertMany(records));
    this.workflowService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class WorkflowQuery extends QueryEntity<WorkflowState, Workflow> {
  constructor(protected store: WorkflowStore) {
    super(store);
  }
}
