import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerLogModel } from '../models/game-server-log';
import { gameServerLogService } from '../services/game-server-log';

export interface GameServerLogState extends EntityState<GameServerLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'game-server-logs', resettable: true })
export class GameServerLogStore extends EntityStore<GameServerLogState, GameServerLogModel> {
  constructor() {
    super();

    gameServerLogService.emitter.on('create', record => this.add(record));
    gameServerLogService.emitter.on('delete', _id => this.remove(_id));
    gameServerLogService.emitter.on('set', records => this.upsertMany(records));
    gameServerLogService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class GameServerLogQuery extends QueryEntity<GameServerLogState, GameServerLogModel> {
  constructor(protected store: GameServerLogStore) {
    super(store);
  }
}

export const gameServerLogStore = new GameServerLogStore();
export const gameServerLogQuery = new GameServerLogQuery(gameServerLogStore);
