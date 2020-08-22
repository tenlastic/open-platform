import { Model } from './model';

export class WebSocket extends Model {
  public gameId: string;
  public userId: string;

  constructor(params?: Partial<WebSocket>) {
    super(params);
  }
}
