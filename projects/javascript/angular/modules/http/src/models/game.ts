import { Model } from './model';

export namespace IGame {
  export enum Access {
    Private = 'private',
    PrivatePublic = 'private-public',
    Public = 'public',
  }
}

export class Game extends Model {
  public access: IGame.Access;
  public background: string;
  public description: string;
  public icon: string;
  public images: string[];
  public metadata: any;
  public namespaceId: string;
  public subtitle: string;
  public title: string;
  public videos: string[];

  constructor(params?: Partial<Game>) {
    super(params);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title} (${this.subtitle})` : this.title;
  }
}
