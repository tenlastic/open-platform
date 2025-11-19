import { WorkflowLogModel } from '../models';
import { WorkflowLogService } from '../services';
import { BaseState } from './base';

export class WorkflowLogState extends BaseState<WorkflowLogModel, WorkflowLogService> {
  constructor(service: WorkflowLogService) {
    super('unix', service);
  }
}
