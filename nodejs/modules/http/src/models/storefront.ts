import { BaseModel } from './base';

export class StorefrontModel extends BaseModel {
  public _id: string;
  public background: string;
  public createdAt: Date;
  public description: string;
  public icon: string;
  public images: string[];
  public logo: string;
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
