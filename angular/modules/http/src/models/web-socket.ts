import { Model } from './model';
import { User } from './user';

export class WebSocket extends Model {
  public disconnectedAt: Date;
  public namespaceId: string;
  public user: User;
  public userId: string;

  constructor(params?: Partial<WebSocket>) {
    super(params);

    this.disconnectedAt = params.disconnectedAt ? new Date(params.disconnectedAt) : null;
  }

  public get duration() {
    if (!this.disconnectedAt) {
      return 0;
    }

    return this.disconnectedAt.getTime() - this.createdAt.getTime();
  }
}
