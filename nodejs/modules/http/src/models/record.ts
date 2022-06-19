import { BaseModel } from './base';

export class RecordModel extends BaseModel {
  public collectionId: string;
  public databaseId: string;
  public namespaceId: string;
  public properties: any;

  constructor(parameters: Partial<RecordModel> = {}) {
    super(parameters);
  }
}
