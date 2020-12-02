import { Model } from './model';

export class WebSocket extends Model {
  public namespaceId: string;
  public userId: string;

  constructor(params?: Partial<WebSocket>) {
    super(params);
  }
}
