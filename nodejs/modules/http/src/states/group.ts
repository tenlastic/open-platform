import { GroupModel } from '../models';
import { GroupService } from '../services';
import { BaseState } from './base';

export class GroupState extends BaseState<GroupModel, GroupService> {
  constructor(service: GroupService) {
    super('_id', service);
  }
}
