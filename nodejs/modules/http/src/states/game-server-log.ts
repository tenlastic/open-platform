import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerLogModel } from '../models/game-server-log';

export interface GameServerLogState extends EntityState<GameServerLogModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: 'unix', name: 'game-server-logs', resettable: true })
export class GameServerLogStore extends EntityStore<GameServerLogState, GameServerLogModel> {}

export class GameServerLogQuery extends QueryEntity<GameServerLogState, GameServerLogModel> {
  constructor(protected store: GameServerLogStore) {
    super(store);
  }
}
