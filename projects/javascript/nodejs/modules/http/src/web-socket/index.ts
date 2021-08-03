import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import * as WS from 'ws';

import { BaseModel } from '../models';
import { ServiceEventEmitter } from '../services';
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
    this.socket.addEventListener('message', msg => {
      const payload = JSON.parse(msg.data as string);
      this.emitter.emit('message', payload);
    });
    this.socket.addEventListener('open', () => this.emitter.emit('open'));

    return this.socket;
  }

  public subscribe(emitter: ServiceEventEmitter<BaseModel>, parameters: SubscribeParameters) {
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
        emitter.emit('delete', payload.fullDocument._id);
      } else if (payload.operationType === 'insert') {
        emitter.emit('create', payload.fullDocument);
      } else if (payload.operationType === 'update') {
        emitter.emit('update', payload.fullDocument);
      }

      this.emitter.emit(_id, payload);
    });

    return _id;
  }

  public unsubscribe(_id: string) {
    if (!this.socket) {
      return;
    }

    const data = { _id, method: 'subscribe' };
    this.socket.send(JSON.stringify(data));
  }
}
