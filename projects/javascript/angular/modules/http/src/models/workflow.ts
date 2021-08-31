import { Model } from './model';

export namespace IWorkflow {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '1', value: 1 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 1 * 1000 * 1000 * 1000 },
  ];
  export const Parallelisms = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
  ];
  export const Storage = [
    { label: '5 GB', value: 5 * 1000 * 1000 * 1000 },
    { label: '10 GB', value: 10 * 1000 * 1000 * 1000 },
    { label: '20 GB', value: 20 * 1000 * 1000 * 1000 },
  ];

  export interface Dag {
    tasks: Task[];
  }

  export interface Env {
    name: string;
    value: string;
  }

  export interface Node {
    _id?: string;
    children?: string[];
    displayName?: string;
    finishedAt?: Date;
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

export class Workflow extends Model {
  public _id: string;
  public cpu: number;
  public createdAt: Date;
  public preemptible: boolean;
  public memory: number;
  public name: string;
  public namespaceId: string;
  public spec: IWorkflow.Spec;
  public status: IWorkflow.Status;
  public storage: number;
  public updatedAt: Date;

  constructor(params: Partial<Workflow> = {}) {
    super(params);
  }

  public getNestedStatusNodes() {
    const nodes = JSON.parse(JSON.stringify(this.status.nodes)).reverse();

    for (const node of nodes) {
      if (node.children) {
        for (const childId of node.children) {
          const child = nodes.find(n => n._id === childId);
          child.parent = node._id;
        }
      }
    }

    const children = this.getChildren(nodes);

    return [
      {
        children,
        finishedAt: this.status.finishedAt,
        message: this.status.message,
        phase: this.status.phase,
        startedAt: this.status.startedAt,
        type: 'Workflow',
      },
    ];
  }

  private getChildren(data, parent?) {
    return data.reduce((previous, current) => {
      const obj = Object.assign({}, current);

      if (parent === current.parent) {
        const children = this.getChildren(data, current._id);

        if (children.length) {
          obj.children = children;
        }

        previous.push(obj);
      }

      return previous;
    }, []);
  }
}
