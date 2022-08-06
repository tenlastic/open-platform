import { BaseModel } from './base';

export namespace IArticle {
  export enum Type {
    Guide = 'Guide',
    News = 'News',
    PatchNotes = 'Patch Notes',
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

    this.publishedAt = parameters.publishedAt ? new Date(parameters.publishedAt) : null;
  }
}
