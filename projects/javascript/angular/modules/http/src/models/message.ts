import { Model } from './model';

export class Message extends Model {
  public body: string;
  public fromUserId: string;
  public toUserIds: string[];

  constructor(params?: Partial<Message>) {
    super(params);
  }
}
