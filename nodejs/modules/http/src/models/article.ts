import { BaseModel } from './base';

export namespace IArticle {
  export enum Type {
    Guide = 'Guide',
    News = 'News',
    PatchNotes = 'PatchNotes',
  }
}

export class ArticleModel extends BaseModel {
  public body: string;
  public caption: string;
  public namespaceId: string;
  public publishedAt: Date;
  public title: string;
  public type: IArticle.Type;

  constructor(parameters?: Partial<ArticleModel>) {
    super(parameters);

    this.publishedAt = this.publishedAt ? new Date(this.publishedAt) : null;
  }
}
