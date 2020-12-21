import { Model } from './model';

export namespace IWorkflow {
  export interface Env {
    name: string;
    value: string;
  }

  export interface RetryStrategy {
    limit: number;
    retryPolicy: RetryStrategyRetryPolicy;
  }

  export enum RetryStrategyRetryPolicy {
    OnError = 'OnError',
    OnFailure = 'OnFailure',
  }

  export interface Script {
    args?: string[];
    command?: string[];
    env?: Env[];
    image: string;
    source: string;
    workingDir?: string;
  }

  export interface Sidecar {
    args?: string[];
    command?: string[];
    env?: Env[];
    image: string;
    name: string;
  }

  export interface Spec {
    tasks?: Task[];
    templates?: Template[];
  }

  export interface Task {
    dependencies?: string[];
    name: string;
    template: string;
  }

  export interface Template {
    name: string;
    retryStrategy?: RetryStrategy;
    script: Script;
    sidecars?: Sidecar[];
  }
}

export class Workflow extends Model {
  public _id: string;
  public createdAt: Date;
  public isPreemptible: boolean;
  public name: string;
  public namespaceId: string;
  public workflowTemplateId: string;
  public spec: IWorkflow.Spec;
  public updatedAt: Date;

  constructor(params: Partial<Workflow> = {}) {
    super(params);
  }
}
