import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerLogModel } from '../models/game-server-log';
import { BaseStore } from './base';

export interface GameServerLogState extends EntityState<GameServerLogModel> {}

@StoreConfig({ idKey: 'unix', name: 'game-server-logs', resettable: true })
export class GameServerLogStore extends BaseStore<GameServerLogState, GameServerLogModel> {}

export class GameServerLogQuery extends QueryEntity<GameServerLogState, GameServerLogModel> {
  constructor(protected store: GameServerLogStore) {
    super(store);
  }
}
