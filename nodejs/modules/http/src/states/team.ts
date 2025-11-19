import { TeamModel } from '../models';
import { TeamService } from '../services';
import { BaseState } from './base';

export class TeamState extends BaseState<TeamModel, TeamService> {
  constructor(service: TeamService) {
    super('_id', service);
  }
}
