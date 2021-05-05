import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { WorkflowLog } from '../models/workflow-log';
import { WorkflowLogService } from '../services/workflow-log/workflow-log.service';
import { WorkflowQuery } from './workflow';

export interface WorkflowLogState extends EntityState<WorkflowLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'workflow-logs', resettable: true })
export class WorkflowLogStore extends EntityStore<WorkflowLogState, WorkflowLog> {
  constructor(private workflowLogService: WorkflowLogService) {
    super();

    this.workflowLogService.onCreate.subscribe(record => this.add(record));
    this.workflowLogService.onDelete.subscribe(record => this.remove(record._id));
    this.workflowLogService.onRead.subscribe(records => this.upsertMany(records));
    this.workflowLogService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class WorkflowLogQuery extends QueryEntity<WorkflowLogState, WorkflowLog> {
  constructor(private workflowQuery: WorkflowQuery, protected store: WorkflowLogStore) {
    super(store);
  }

  public populate($input: Observable<WorkflowLog[]>) {
    return combineLatest([$input, this.workflowQuery.selectAll({ asObject: true })]).pipe(
      map(([workflowLogs, workflows]) => {
        return workflowLogs.map(workflowLog => {
          return new WorkflowLog({
            ...workflowLog,
            workflow: workflows[workflowLog.workflowId],
          });
        });
      }),
    );
  }
}
