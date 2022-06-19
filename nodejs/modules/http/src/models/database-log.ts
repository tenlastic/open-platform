import { databaseQuery } from '../stores/database';
import { BaseModel } from './base';

export class DatabaseLogModel extends BaseModel {
  public body: string;
  public get database() {
    return databaseQuery.getEntity(this.databaseId);
  }
  public databaseId: string;
  public nodeId: string;
  public unix: number;

  constructor(parameters: Partial<DatabaseLogModel> = {}) {
    super(parameters);
  }
}
