import { MatchInvitationModel } from '../models';
import { MatchInvitationService } from '../services';
import { BaseState } from './base';

export class MatchInvitationState extends BaseState<MatchInvitationModel, MatchInvitationService> {
  constructor(service: MatchInvitationService) {
    super('_id', service);
  }
}
