import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { WebSocketModel } from '../models/web-socket';
import { BaseStore } from './base';
import { UserQuery } from './user';

export interface WebSocketState extends EntityState<WebSocketModel> {}

@StoreConfig({ idKey: '_id', name: 'websockets', resettable: true })
export class WebSocketStore extends BaseStore<WebSocketState, WebSocketModel> {}

export class WebSocketQuery extends QueryEntity<WebSocketState, WebSocketModel> {
  constructor(protected store: WebSocketStore, protected userQuery: UserQuery) {
    super(store);
  }
}
