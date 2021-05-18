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

export interface BuildModel extends BaseModel {
  _id?: string;
  createdAt?: Date;
  entrypoint: string;
  files?: IBuild.File[];
  gameId?: string;
  name: string;
  namespaceId: string;
  platform: IBuild.Platform;
  publishedAt?: Date;
  reference?: IBuild.Reference;
  status?: IWorkflow.Status;
  updatedAt?: Date;
}
