import { Model } from './model';

export namespace IGame {
  export enum Access {
    Private = 'private',
    PrivatePublic = 'private-public',
    Public = 'public',
  }
}

export class Game extends Model {
  public _id: string;
  public access: IGame.Access;
  public background: string;
  public createdAt: Date;
  public description: string;
  public icon: string;
  public images: string[];
  public namespaceId: string;
  public subtitle: string;
  public title: string;
  public updatedAt: Date;
  public videos: string;

  constructor(params?: Partial<Game>) {
    super(params);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title}:${this.subtitle}` : this.title;
  }
}
