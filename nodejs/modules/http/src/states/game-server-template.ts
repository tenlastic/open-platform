import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerTemplateModel } from '../models/game-server-template';

export interface GameServerTemplateState extends EntityState<GameServerTemplateModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'game-servers', resettable: true })
export class GameServerTemplateStore extends EntityStore<
  GameServerTemplateState,
  GameServerTemplateModel
> {}

export class GameServerTemplateQuery extends QueryEntity<
  GameServerTemplateState,
  GameServerTemplateModel
> {
  constructor(protected store: GameServerTemplateStore) {
    super(store);
  }
}
