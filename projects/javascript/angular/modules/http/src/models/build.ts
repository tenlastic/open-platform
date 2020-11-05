import { Model } from './model';

export namespace IBuild {
  export interface Entrypoints {
    linux64?: string;
    mac64?: string;
    server64?: string;
    windows64?: string;
  }

  export enum Platform {
    Linux64,
    Mac64,
    Server64,
    Windows64,
  }
}

export class Build extends Model {
  public _id: string;
  public createdAt: Date;
  public entrypoints: IBuild.Entrypoints;
  public namespaceId: string;
  public publishedAt: Date;
  public version: string;
  public updatedAt: Date;

  constructor(params: Partial<Build> = {}) {
    super(params);

    this.entrypoints = params.entrypoints || {};
    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }
}
