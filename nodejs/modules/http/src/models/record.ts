import { BaseModel } from './base';

export class RecordModel extends BaseModel {
  public collectionId: string;
  public namespaceId: string;
  public properties: unknown;
  public userId: string;

  constructor(parameters?: Partial<RecordModel>) {
    super(parameters);
  }
}
