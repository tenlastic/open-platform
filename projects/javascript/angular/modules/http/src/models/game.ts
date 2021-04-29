import { Model } from './model';

export class Game extends Model {
  public _id: string;
  public authorizedUserIds: string[];
  public background: string;
  public createdAt: Date;
  public description: string;
  public icon: string;
  public images: string[];
  public namespaceId: string;
  public public: boolean;
  public subtitle: string;
  public title: string;
  public unauthorizedUserIds: string[];
  public updatedAt: Date;
  public videos: string;

  constructor(params?: Partial<Game>) {
    super(params);
  }

  public get fullTitle() {
    const subtitle = this.subtitle ? `: ${this.subtitle}` : '';
    return `${this.title}${subtitle}`;
  }
}
