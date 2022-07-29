import { BaseModel } from './base';

export namespace IStorefront {
  export enum Access {
    Private = 'private',
    PrivatePublic = 'private-public',
    Public = 'public',
  }
}

export class StorefrontModel extends BaseModel {
  public _id: string;
  public access: IStorefront.Access;
  public background: string;
  public createdAt: Date;
  public description: string;
  public icon: string;
  public images: string[];
  public namespaceId: string;
  public subtitle: string;
  public title: string;
  public updatedAt: Date;
  public videos: string;

  constructor(parameters: Partial<StorefrontModel> = {}) {
    super(parameters);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title}:${this.subtitle}` : this.title;
  }
}
