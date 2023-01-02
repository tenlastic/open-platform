import { BaseModel } from './base';

export class RecordModel extends BaseModel {
  public collectionId: string;
  public namespaceId: string;
  public properties: any;
  public userId: string;

  constructor(parameters?: Partial<RecordModel>) {
    super(parameters);
  }
}
