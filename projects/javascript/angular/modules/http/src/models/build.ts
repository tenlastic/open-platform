import { Model } from './model';
import { IWorkflow } from './workflow';

export namespace IBuild {
  export interface File {
    compressedBytes: number;
    md5: string;
    path: string;
    uncompressedBytes: number;
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
  public namespaceId: string;
  public platform: IBuild.Platform;
  public publishedAt: Date;
  public reference: IBuild.Reference;
  public status: IWorkflow.Status;
  public version: string;
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
