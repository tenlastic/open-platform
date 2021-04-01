import { GameServerModel } from '../models';
import { gameServerStore } from '../stores';
import { BaseService } from './base';

const apiRootUrl = process.env.API_URL;

export class GameServerService extends BaseService<GameServerModel> {
  protected store = gameServerStore;
  protected url = `${apiRootUrl}/game-servers`;
}

export const gameServerService = new GameServerService();
