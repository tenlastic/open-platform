import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export class GroupModel extends BaseModel {
  public isOpen: boolean;
  public userIds: string[];
  public get users() {
    return this.userIds.map(ui => userQuery.getEntity(ui));
  }

  constructor(parameters: Partial<GroupModel> = {}) {
    super(parameters);
  }
}
