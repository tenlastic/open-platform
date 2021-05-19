import { BaseModel } from './base';

export namespace IGame {
  export enum Access {
    Private = 'private',
    PrivatePublic = 'private-public',
    Public = 'public',
  }
}

export class GameModel extends BaseModel {
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

  constructor(parameters: Partial<GameModel> = {}) {
    super(parameters);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title}:${this.subtitle}` : this.title;
  }
}
