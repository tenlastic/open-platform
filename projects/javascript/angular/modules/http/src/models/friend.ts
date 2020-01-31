import { Model } from './model';

export class Friend extends Model {
  public fromUserId: string;
  public toUserId: string;

  constructor(params?: Partial<Friend>) {
    super(params);
  }
}
