import { BaseModel } from './base';

export namespace IMessage {
  export class ReadReceipt {
    public createdAt: Date;
    public userId: string;

    constructor(parameters?: Partial<ReadReceipt>) {
      Object.assign(this, parameters);

      this.createdAt = parameters?.createdAt ? new Date(parameters.createdAt) : null;
    }
  }
}

export class MessageModel extends BaseModel {
  public body: string;
  public fromUserId: string;
  public readReceipts: IMessage.ReadReceipt[];
  public toGroupId: string;
  public toUserId: string;

  constructor(parameters?: Partial<MessageModel>) {
    super(parameters);

    this.readReceipts = parameters?.readReceipts
      ? parameters.readReceipts.map((rr) => new IMessage.ReadReceipt(rr))
      : [];
  }
}
