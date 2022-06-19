import { Model } from './model';

export class DatabaseLog extends Model {
  public body: string;
  public databaseId: string;
  public nodeId: string;
  public unix: number;

  constructor(params?: Partial<DatabaseLog>) {
    super(params);
  }
}
