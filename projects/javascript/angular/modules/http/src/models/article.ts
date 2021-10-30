import { Model } from './model';
import { Game } from './game';
import { Namespace } from './namespace';

export class Article extends Model {
  public body: string;
  public caption: string;
  public game: Game;
  public gameId: string;
  public namespace: Namespace;
  public namespaceId: string;
  public publishedAt: Date;
  public title: string;
  public type: string;

  constructor(params: Partial<Article> = {}) {
    super(params);

    this.game = this.game ? new Game(this.game) : null;
    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.publishedAt = params.publishedAt ? new Date(params.publishedAt) : null;
  }
}
