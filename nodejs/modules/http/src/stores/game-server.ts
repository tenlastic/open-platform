import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerModel } from '../models/game-server';
import { gameServerService } from '../services/game-server';

export interface GameServerState extends EntityState<GameServerModel> {}

@StoreConfig({ idKey: '_id', name: 'game-servers', resettable: true })
export class GameServerStore extends EntityStore<GameServerState, GameServerModel> {
  constructor() {
    super();

    gameServerService.emitter.on('create', record => this.add(record));
    gameServerService.emitter.on('delete', _id => this.remove(_id));
    gameServerService.emitter.on('set', records => this.upsertMany(records));
    gameServerService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class GameServerQuery extends QueryEntity<GameServerState, GameServerModel> {
  constructor(protected store: GameServerStore) {
    super(store);
  }
}

export const gameServerStore = new GameServerStore();
export const gameServerQuery = new GameServerQuery(gameServerStore);
