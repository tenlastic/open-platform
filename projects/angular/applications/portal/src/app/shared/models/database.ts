import { Model } from './model';

export class Database extends Model {
  public name: string;
  public namespaceId: string;

  constructor(params?: Partial<Database>) {
    super(params);
  }
}
