import { BaseModel } from './base';
import { IWorkflow } from './workflow';

export namespace IBuild {
  export interface File {
    compressedBytes?: number;
    md5?: string;
    path?: string;
    uncompressedBytes?: number;
  }

  export interface Node {
    children?: string[];
    container?: string;
    displayName?: string;
    finishedAt?: Date;
    id?: string;
    message?: string;
    name?: string;
    outboundNodes?: string[];
    parent?: string;
    phase?: string;
    pod?: string;
    startedAt?: Date;
    templatename?: string;
    type?: string;
  }

  export enum Platform {
    Linux64 = 'Linux64',
    Mac64 = 'Mac64',
    Server64 = 'Server64',
    Windows64 = 'Windows64',
  }

  export interface Reference {
    _id: string;
    files: string[];
  }
}

export class BuildModel extends BaseModel {
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

  constructor(parameters?: Partial<BuildModel>) {
    super(parameters);

    this.publishedAt = this.publishedAt ? new Date(this.publishedAt) : null;
  }

  public getNestedStatusNodes() {
    if (!this.status || !this.status.nodes) {
      return [];
    }

    const nodes = JSON.parse(JSON.stringify(this.status.nodes));
    const sortedNodes: IBuild.Node[] = nodes.sort((a, b) => {
      if (a.startedAt === b.startedAt) {
        return 0;
      }

      return a.startedAt > b.startedAt ? 1 : -1;
    });

    for (const node of sortedNodes) {
      if (node.children) {
        for (const childId of node.children) {
          const child = sortedNodes.find((n) => n.id === childId);
          child.parent = node.id;
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

  private getChildren(data: IBuild.Node[], parent?: string) {
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

  public getFilePath(path: string) {
    return `namespaces/${this.namespaceId}/builds/${this._id}/${path}`;
  }

  public getZipPath() {
    return `namespaces/${this.namespaceId}/builds/${this._id}/archive.zip`;
  }
}
