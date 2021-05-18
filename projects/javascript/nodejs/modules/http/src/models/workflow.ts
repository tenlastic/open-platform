import { BaseModel } from './base';

export namespace IWorkflow {
  export interface Dag {
    tasks: Task[];
  }

  export interface Env {
    name: string;
    value: string;
  }

  export interface Node {
    children?: string[];
    displayName?: string;
    finishedAt?: Date;
    id?: string;
    message?: string;
    name?: string;
    outboundNodes?: string[];
    phase?: string;
    startedAt?: Date;
    templatename?: string;
    type?: string;
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
    workspace?: boolean;
  }

  export interface Sidecar {
    args?: string[];
    command?: string[];
    env?: Env[];
    image: string;
    name: string;
  }

  export interface Spec {
    entrypoint: string;
    parallelism: number;
    templates?: Template[];
  }

  export interface Status {
    finishedAt?: Date;
    message?: string;
    nodes?: Node[];
    phase?: string;
    startedAt?: Date;
  }

  export interface Task {
    dependencies?: string[];
    name: string;
    template: string;
  }

  export interface Template {
    dag?: Dag;
    name: string;
    retryStrategy?: RetryStrategy;
    script: Script;
    sidecars?: Sidecar[];
  }
}

export interface WorkflowModel extends BaseModel {
  _id?: string;
  cpu?: number;
  createdAt?: Date;
  preemptible?: boolean;
  memory?: number;
  name?: string;
  namespaceId?: string;
  spec?: IWorkflow.Spec;
  status?: IWorkflow.Status;
  storage?: number;
  updatedAt?: Date;
}
