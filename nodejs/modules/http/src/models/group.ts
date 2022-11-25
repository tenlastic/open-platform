import { BaseModel } from './base';

export class GroupModel extends BaseModel {
  public isOpen: boolean;
  public name: string;
  public userIds: string[];

  constructor(parameters?: Partial<GroupModel>) {
    super(parameters);
  }
}
