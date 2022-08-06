import { BaseModel } from './base';

export class GroupModel extends BaseModel {
  public isOpen: boolean;
  public userIds: string[];

  constructor(parameters?: Partial<GroupModel>) {
    super(parameters);
  }
}
