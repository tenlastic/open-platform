import { Model } from './model';

export namespace IBuild {
  export enum Platform {
    Linux32,
    Linux64,
    Mac32,
    Mac64,
    Windows32,
    Windows64,
  }
}
export class Build extends Model {
  public _id: string;
  public createdAt: Date;
  public entrypoint: string;
  public namespaceId: string;
  public publishedAt: Date;
  public version: string;
  public updatedAt: Date;

  constructor(params: Partial<Build> = {}) {
    super(params);

    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }
}
