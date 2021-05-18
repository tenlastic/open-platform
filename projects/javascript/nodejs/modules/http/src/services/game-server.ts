import { apiUrl } from '../api-url';
import { GameServerModel } from '../models';
import { gameServerStore } from '../stores';
import { BaseService } from './base';

export class GameServerService extends BaseService<GameServerModel> {
  protected store = gameServerStore;
  protected get url() {
    return `${apiUrl}/game-servers`;
  }
}

export const gameServerService = new GameServerService();
