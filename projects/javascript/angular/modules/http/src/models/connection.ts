import { Model } from './model';

export class Connection extends Model {
  public disconnectedAt: Date;
  public gameId: string;
  public userId: string;

  constructor(params?: Partial<Connection>) {
    super(params);
  }
}
