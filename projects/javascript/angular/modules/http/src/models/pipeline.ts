import { Model } from './model';

export namespace IPipeline {
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
    steps?: Step[];
    templates?: Template[];
  }

  export interface Step {
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

export class Pipeline extends Model {
  public _id: string;
  public createdAt: Date;
  public name: string;
  public namespaceId: string;
  public pipelineTemplateId: string;
  public spec: IPipeline.Spec;
  public updatedAt: Date;

  constructor(params: Partial<Pipeline> = {}) {
    super(params);
  }
}
