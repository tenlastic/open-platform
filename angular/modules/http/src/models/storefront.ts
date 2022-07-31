import { Model } from './model';

export class Storefront extends Model {
  public background: string;
  public description: string;
  public icon: string;
  public images: string[];
  public metadata: any;
  public namespaceId: string;
  public subtitle: string;
  public title: string;
  public videos: string[];

  constructor(params?: Partial<Storefront>) {
    super(params);
  }

  public get fullTitle() {
    return this.subtitle ? `${this.title} (${this.subtitle})` : this.title;
  }
}
