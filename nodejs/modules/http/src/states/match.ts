import { MatchModel } from '../models';
import { MatchService } from '../services';
import { BaseState } from './base';

export class MatchState extends BaseState<MatchModel, MatchService> {
  constructor(service: MatchService) {
    super('_id', service);
  }
}
