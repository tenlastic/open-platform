import { Model } from './model';

export class Article extends Model {
  public _id: string;
  public body: string;
  public caption: string;
  public createdAt: Date;
  public namespaceId: string;
  public publishedAt: Date;
  public title: string;
  public type: string;
  public updatedAt: Date;

  constructor(params: Partial<Article> = {}) {
    super(params);

    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }
}
