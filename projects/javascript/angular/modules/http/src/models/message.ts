import { Model } from './model';

export class Message extends Model {
  public body: string;
  public fromUserId: string;
  public readAt: Date;
  public toUserId: string;

  constructor(params?: Partial<Message>) {
    super(params);

    this.readAt = params.readAt ? new Date(params.readAt) : null;
  }
}
