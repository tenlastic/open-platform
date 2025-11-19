import { WorkflowModel } from '../models';
import { WorkflowService } from '../services';
import { BaseState } from './base';

export class WorkflowState extends BaseState<WorkflowModel, WorkflowService> {
  constructor(service: WorkflowService) {
    super('_id', service);
  }
}
