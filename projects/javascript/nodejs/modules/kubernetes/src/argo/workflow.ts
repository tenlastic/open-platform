import { CustomObjectBaseApiV1 } from '../bases';

export interface V1Workflow {
  metadata: {
    annotations?: { [key: string]: string };
    label?: { [key: string]: string };
    name: string;
    resourceVersion?: string;
    uid?: string;
  };
  spec: object;
}

export class WorkflowApiV1 extends CustomObjectBaseApiV1<V1Workflow> {
  protected group = 'argoproj.io';
  protected kind = 'Workflow';
  protected plural = 'workflows';
  protected version = 'v1alpha1';
}

export const workflowApiV1 = new WorkflowApiV1();