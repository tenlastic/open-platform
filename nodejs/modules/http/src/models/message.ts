import { BaseModel } from './base';

export class MessageModel extends BaseModel {
  public body: string;
  public fromUserId: string;
  public readByUserIds: string[];
  public toGroupId: string;
  public toUserId: string;

  constructor(parameters?: Partial<MessageModel>) {
    super(parameters);
  }
}
