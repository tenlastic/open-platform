import { Model } from './model';

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
  public createdAt: Date;
  public isPreemptible: boolean;
  public name: string;
  public namespaceId: string;
  public spec: IWorkflow.Spec;
  public status: IWorkflow.Status;
  public updatedAt: Date;

  constructor(params: Partial<Workflow> = {}) {
    super(params);
  }

  public getNestedStatusNodes() {
    const nodes = JSON.parse(JSON.stringify(this.status.nodes));

    for (const node of nodes) {
      if (node.children) {
        for (const childId of node.children) {
          const child = nodes.find(n => n.id === childId);
          child.parent = node.id;
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
        const children = this.getChildren(data, current.id);

        if (children.length) {
          obj.children = children;
        }

        previous.push(obj);
      }

      return previous;
    }, []);
  }
}
