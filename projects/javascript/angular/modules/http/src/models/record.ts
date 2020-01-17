import { Model } from './model';

export class Record extends Model {
  public collectionId: string;
  public databaseId: string;
  public properties: any;

  constructor(params?: Partial<Record>) {
    super(params);
  }
}
