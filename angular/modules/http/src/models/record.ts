import { Model } from './model';

export class Record extends Model {
  public collectionId: string;
  public namespaceId: string;
  public properties: any;
  public userId: string;

  constructor(params?: Partial<Record>) {
    super(params);
  }
}
