import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerModel } from '../models/game-server';

export interface GameServerState extends EntityState<GameServerModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'game-servers', resettable: true })
export class GameServerStore extends EntityStore<GameServerState, GameServerModel> {}

export class GameServerQuery extends QueryEntity<GameServerState, GameServerModel> {
  constructor(protected store: GameServerStore) {
    super(store);
  }
}
