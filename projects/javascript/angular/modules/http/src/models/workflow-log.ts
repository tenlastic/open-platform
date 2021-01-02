import { Workflow } from './workflow';
import { Model } from './model';

export class WorkflowLog extends Model {
  public body: string;
  public nodeId: string;
  public unix: number;
  public workflow: Workflow;
  public workflowId: string;

  constructor(params?: Partial<WorkflowLog>) {
    super(params);

    this.workflow = this.workflow ? new Workflow(this.workflow) : null;
  }
}
