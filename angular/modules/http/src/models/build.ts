import { Model } from './model';
import { IWorkflow } from './workflow';

export namespace IBuild {
  export interface File {
    compressedBytes: number;
    md5: string;
    path: string;
    uncompressedBytes: number;
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

  export enum Platform {
    Server64 = 'server64',
    Windows64 = 'windows64',
  }

  export interface Reference {
    _id: string;
    files: string[];
  }
}

export class Build extends Model {
  public _id: string;
  public createdAt: Date;
  public entrypoint: string;
  public files: IBuild.File[];
  public name: string;
  public namespaceId: string;
  public platform: IBuild.Platform;
  public publishedAt: Date;
  public reference: IBuild.Reference;
  public status: IWorkflow.Status;
  public updatedAt: Date;

  constructor(params: Partial<Build> = {}) {
    super(params);

    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }

  public getNestedStatusNodes() {
    if (!this.status || !this.status.nodes) {
      return [];
    }

    const nodes = JSON.parse(JSON.stringify(this.status.nodes));
    const sortedNodes = nodes.sort((a, b) => {
      if (a.startedAt === b.startedAt) {
        return 0;
      }

      return a.startedAt > b.startedAt ? 1 : -1;
    });

    for (const node of sortedNodes) {
      if (node.children) {
        for (const childId of node.children) {
          const child = sortedNodes.find((n) => n._id === childId);
          child.parent = node._id;
        }
      }
    }

    const children = this.getChildren(sortedNodes);

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
