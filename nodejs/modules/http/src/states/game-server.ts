import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerModel } from '../models/game-server';
import { BaseStore } from './base';

export interface GameServerState extends EntityState<GameServerModel> {}

@StoreConfig({ idKey: '_id', name: 'game-servers', resettable: true })
export class GameServerStore extends BaseStore<GameServerState, GameServerModel> {
  public akitaPreAddEntity(entity: GameServerModel) {
    return new GameServerModel(entity);
  }
}

export class GameServerQuery extends QueryEntity<GameServerState, GameServerModel> {
  constructor(protected store: GameServerStore) {
    super(store);
  }
}
