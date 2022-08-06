import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerModel } from '../models/game-server';
import { QueueQuery } from './queue';

export interface GameServerState extends EntityState<GameServerModel> {}

@StoreConfig({ idKey: '_id', name: 'game-servers', resettable: true })
export class GameServerStore extends EntityStore<GameServerState, GameServerModel> {}

export class GameServerQuery extends QueryEntity<GameServerState, GameServerModel> {
  constructor(private queueQuery: QueueQuery, protected store: GameServerStore) {
    super(store);
  }
}
