import { Model } from './model';
import { Namespace } from './namespace';

export namespace IArticle {
  export enum Type {
    Guide = 'Guide',
    News = 'News',
    PatchNotes = 'Patch Notes',
  }
}

export class Article extends Model {
  public body: string;
  public caption: string;
  public namespace: Namespace;
  public namespaceId: string;
  public publishedAt: Date;
  public title: string;
  public type: IArticle.Type;

  constructor(params: Partial<Article> = {}) {
    super(params);

    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }
}
