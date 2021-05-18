import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import * as WS from 'ws';

import { BaseStore } from '../stores';
import { getAccessToken } from '../tokens';

export interface SubscribeParameters {
  collection: string;
  operationType?: Array<'delete' | 'insert' | 'update'>;
  resumeToken?: string;
  where?: any;
}

export class WebSocket {
  public emitter = new EventEmitter();
  public socket: WS;

  public close() {
    if (!this.socket) {
      return;
    }

    this.socket.close(1000);
  }

  public async connect(url: string) {
    if (this.socket) {
      return this.socket;
    }

    const accessToken = await getAccessToken();
    this.socket = new WS(`${url}?access_token=${accessToken}`);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => this.socket.send(JSON.stringify(data)), 5000);

    this.socket.addEventListener('open', () => this.emitter.emit('open'));
    this.socket.addEventListener('close', e => {
      clearInterval(interval);
      this.socket = null;

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url), 5000);
      }
    });
    this.socket.addEventListener('error', e => {
      console.error('Socket error:', e.message);
      this.socket.close();
    });

    return this.socket;
  }

  public subscribe(parameters: SubscribeParameters, store: BaseStore<any>) {
    const _id = uuid();
    const data = { _id, method: 'subscribe', parameters };

    this.socket.send(JSON.stringify(data));
    this.socket.addEventListener('message', msg => {
      const payload = JSON.parse(msg.data as string);

      // If the response is for a different request, ignore it.
      if (payload._id !== _id) {
        return;
      }

      if (payload.operationType === 'delete') {
        store.delete(payload.fullDocument._id);
      } else if (payload.operationType === 'insert') {
        store.insert(payload.fullDocument);
      } else if (payload.operationType === 'update') {
        store.update(payload.fullDocument);
      }

      this.emitter.emit(_id, payload);
    });

    return _id;
  }

  public unsubscribe(_id: string) {
    if (!this.socket) {
      return;
    }

    const data = { _id, method: 'unsubscribe' };
    this.socket.send(JSON.stringify(data));
  }
}
