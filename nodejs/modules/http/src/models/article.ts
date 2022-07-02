import { namespaceQuery } from '../stores/namespace';
import { BaseModel } from './base';

export class ArticleModel extends BaseModel {
  public body: string;
  public caption: string;
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public publishedAt: Date;
  public title: string;
  public type: string;

  constructor(parameters: Partial<ArticleModel> = {}) {
    super(parameters);

    this.publishedAt = parameters.publishedAt ? new Date(parameters.publishedAt) : null;
  }
}
