import { Model } from './model';

export class Game extends Model {
  public _id: string;
  public createdAt: Date;
  public description: string;
  public namespaceId: string;
  public slug: string;
  public subtitle: string;
  public title: string;
  public updatedAt: Date;

  constructor(params?: Partial<Game>) {
    super(params);
  }
}
