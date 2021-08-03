import { Model } from './model';

export class WorkflowLog extends Model {
  public body: string;
  public nodeId: string;
  public unix: number;
  public workflowId: string;

  constructor(params?: Partial<WorkflowLog>) {
    super(params);
  }
}
