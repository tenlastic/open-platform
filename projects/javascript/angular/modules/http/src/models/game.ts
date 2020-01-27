import { Model } from './model';

export class Game extends Model {
  public _id: string;
  public background: string;
  public createdAt: Date;
  public description: string;
  public icon: string;
  public images: string[];
  public namespaceId: string;
  public slug: string;
  public subtitle: string;
  public title: string;
  public updatedAt: Date;
  public videos: string;

  constructor(params?: Partial<Game>) {
    super(params);
  }
}
