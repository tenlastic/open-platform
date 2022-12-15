import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WebSocketModel } from '../models/web-socket';
import { UserQuery } from './user';

export interface WebSocketState extends EntityState<WebSocketModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'websockets', resettable: true })
export class WebSocketStore extends EntityStore<WebSocketState, WebSocketModel> {}

export class WebSocketQuery extends QueryEntity<WebSocketState, WebSocketModel> {
  constructor(protected store: WebSocketStore, protected userQuery: UserQuery) {
    super(store);
  }
}
