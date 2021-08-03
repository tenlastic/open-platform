import { gameQuery } from '../stores/game';
import { BaseModel } from './base';
import { IWorkflow } from './workflow';

export namespace IBuild {
  export interface File {
    compressedBytes: number;
    md5: string;
    path: string;
    uncompressedBytes: number;
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

  export enum Platform {
    Server64 = 'server64',
    Windows64 = 'windows64',
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
  public get game() {
    return gameQuery.getEntity(this.gameId);
  }
  public gameId: string;
  public name: string;
  public namespaceId: string;
  public platform: IBuild.Platform;
  public publishedAt: Date;
  public reference: IBuild.Reference;
  public status: IWorkflow.Status;
  public updatedAt: Date;

  constructor(parameters: Partial<BuildModel> = {}) {
    super(parameters);

    this.publishedAt = parameters.publishedAt ? new Date(parameters.publishedAt) : null;
  }

  public getNestedStatusNodes() {
    if (!this.status || !this.status.nodes) {
      return [];
    }

    const nodes = JSON.parse(JSON.stringify(this.status.nodes));

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
