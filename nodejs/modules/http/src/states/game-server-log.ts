import { GameServerLogModel } from '../models';
import { GameServerLogService } from '../services';
import { BaseState } from './base';

export class GameServerLogState extends BaseState<GameServerLogModel, GameServerLogService> {
  constructor(service: GameServerLogService) {
    super('unix', service);
  }
}
