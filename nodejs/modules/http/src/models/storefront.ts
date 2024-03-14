import { IAuthorization } from './authorization';
import { BaseModel } from './base';

export class StorefrontModel extends BaseModel {
  public background: string;
  public description: string;
  public icon: string;
  public images: string[];
  public logo: string;
  public metadata: any;
  public namespaceId: string;
  public roles: IAuthorization.Role[];
  public subtitle: string;
  public title: string;
  public videos: string[];

  constructor(parameters?: Partial<StorefrontModel>) {
    super(parameters);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title} (${this.subtitle})` : this.title;
  }
}
