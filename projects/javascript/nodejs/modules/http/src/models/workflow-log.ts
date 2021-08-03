import { workflowQuery } from '../stores/workflow';
import { BaseModel } from './base';

export class WorkflowLogModel extends BaseModel {
  public body: string;
  public nodeId: string;
  public unix: number;
  public get workflow() {
    return workflowQuery.getEntity(this.workflowId);
  }
  public workflowId: string;

  constructor(parameters: Partial<WorkflowLogModel> = {}) {
    super(parameters);
  }
}
