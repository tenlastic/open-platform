import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { WebSocket } from '../models/web-socket';
import { WebSocketService } from '../services/web-socket/web-socket.service';

export interface WebSocketState extends EntityState<WebSocket> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'websockets' })
export class WebSocketStore extends EntityStore<WebSocketState, WebSocket> {
  constructor(private webSocketService: WebSocketService) {
    super();

    this.webSocketService.onCreate.subscribe(record => this.add(record));
    this.webSocketService.onDelete.subscribe(record => this.remove(record._id));
    this.webSocketService.onRead.subscribe(records => this.upsertMany(records));
    this.webSocketService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class WebSocketQuery extends QueryEntity<WebSocketState, WebSocket> {
  constructor(protected store: WebSocketStore) {
    super(store);
  }
}
