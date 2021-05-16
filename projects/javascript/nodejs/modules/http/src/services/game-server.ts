import { GameServerModel } from '../models';
import { gameServerStore } from '../stores';
import { BaseService } from './base';

const apiUrl = process.env.API_URL;

export class GameServerService extends BaseService<GameServerModel> {
  protected store = gameServerStore;
  protected url = `${apiUrl}/game-servers`;
}

export const gameServerService = new GameServerService();
