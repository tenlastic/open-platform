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
  public namespaceId: string;
  public publishedAt: Date;
  public subtitle: string;
  public title: string;
  public type: IArticle.Type;

  constructor(parameters?: Partial<ArticleModel>) {
    super(parameters);

    if (parameters?.publishedAt) {
      this.publishedAt = new Date(parameters.publishedAt);
    }
  }
}
