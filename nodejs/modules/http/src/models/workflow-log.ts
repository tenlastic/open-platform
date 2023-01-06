import { BaseLogModel } from './base-log';

export class WorkflowLogModel extends BaseLogModel {
  public workflowId: string;

  constructor(parameters?: Partial<WorkflowLogModel>) {
    super(parameters);
  }
}
