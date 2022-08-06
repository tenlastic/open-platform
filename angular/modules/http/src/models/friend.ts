import { BaseModel } from './base';

export class FriendModel extends BaseModel {
  public fromUserId: string;
  public toUserId: string;

  constructor(parameters?: Partial<FriendModel>) {
    super(parameters);
  }
}
