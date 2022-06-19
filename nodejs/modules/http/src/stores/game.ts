import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameModel } from '../models/game';
import { gameService } from '../services/game';

export interface GameState extends EntityState<GameModel> {}

@StoreConfig({ idKey: '_id', name: 'games', resettable: true })
export class GameStore extends EntityStore<GameState, GameModel> {
  constructor() {
    super();

    gameService.emitter.on('create', record => this.add(record));
    gameService.emitter.on('delete', _id => this.remove(_id));
    gameService.emitter.on('set', records => this.upsertMany(records));
    gameService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class GameQuery extends QueryEntity<GameState, GameModel> {
  constructor(protected store: GameStore) {
    super(store);
  }
}

export const gameStore = new GameStore();
export const gameQuery = new GameQuery(gameStore);
