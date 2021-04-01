import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import * as WS from 'ws';

import { accessToken } from '../access-token';
import { BaseStore } from '../stores';

export class WebSocket {
  public emitter = new EventEmitter();
  public socket: WS;

  public close() {
    if (!this.socket) {
      return;
    }

    this.socket.close(1000);
  }

  public connect(url: string) {
    if (this.socket) {
      return this.socket;
    }

    this.socket = new WS(`${url}?access_token=${accessToken}`);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => this.socket.send(JSON.stringify(data)), 5000);

    this.socket.onopen = () => this.emitter.emit('open');
    this.socket.onclose = e => {
      clearInterval(interval);
      this.socket = null;

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url), 5000);
      }
    };
    this.socket.onerror = e => {
      console.error('Socket error:', e.message);
      this.socket.close();
    };

    return this.socket;
  }

  public subscribe(
    collection: string,
    resumeToken: string,
    store: BaseStore<any>,
    where: any = {},
  ) {
    const _id = uuid();
    const data = {
      _id,
      method: 'subscribe',
      parameters: { collection, resumeToken, where },
    };

    this.socket.send(JSON.stringify(data));
    this.socket.onmessage = msg => {
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
    };

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
