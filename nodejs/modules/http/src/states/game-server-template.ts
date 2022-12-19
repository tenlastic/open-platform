import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerTemplateModel } from '../models/game-server-template';
import { BaseStore } from './base';

export interface GameServerTemplateState extends EntityState<GameServerTemplateModel> {}

@StoreConfig({ idKey: '_id', name: 'game-server-templates', resettable: true })
export class GameServerTemplateStore extends BaseStore<
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
