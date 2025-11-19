import { GroupInvitationModel } from '../models';
import { GroupInvitationService } from '../services';
import { BaseState } from './base';

export class GroupInvitationState extends BaseState<GroupInvitationModel, GroupInvitationService> {
  constructor(service: GroupInvitationService) {
    super('_id', service);
  }
}
