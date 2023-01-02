import { BaseModel } from './base';

export class GroupModel extends BaseModel {
  public name: string;
  public open: boolean;
  public userIds: string[];

  constructor(parameters?: Partial<GroupModel>) {
    super(parameters);
  }
}
