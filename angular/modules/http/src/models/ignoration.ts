import { BaseModel } from './base';

export class IgnorationModel extends BaseModel {
  public fromUserId: string;
  public toUserId: string;

  constructor(parameters?: Partial<IgnorationModel>) {
    super(parameters);
  }
}
