import { BaseModel } from './base';

export class GroupModel extends BaseModel {
  public namespaceId: string;
  public userId: string;
  public userIds: string[];

  constructor(parameters?: Partial<GroupModel>) {
    super(parameters);
  }
}
