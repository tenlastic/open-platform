import { Model } from './model';

export class Connection extends Model {
  public gameId: string;
  public userId: string;

  constructor(params?: Partial<Connection>) {
    super(params);
  }
}
