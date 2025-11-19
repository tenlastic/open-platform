import { GameServerModel } from '../models';
import { GameServerService } from '../services';
import { BaseState } from './base';

export class GameServerState extends BaseState<GameServerModel, GameServerService> {
  constructor(service: GameServerService) {
    super('_id', service);
  }
}
