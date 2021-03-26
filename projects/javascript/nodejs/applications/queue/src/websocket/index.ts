import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import { w3cwebsocket as W3CWebSocket } from 'websocket';

import { BaseStore } from '../stores';

const accessToken = process.env.ACCESS_TOKEN;
const queue = JSON.parse(process.env.QUEUE_JSON);
const wssRootUrl = process.env.WSS_ROOT_URL;

export class WebSocket {
  public emitter = new EventEmitter();
  public socket: W3CWebSocket;

  public close() {
    if (!this.socket) {
      return;
    }

    this.socket.close(1000);
  }

  public connect() {
    if (this.socket) {
      return this.socket;
    }

    const hostname = wssRootUrl.replace('http', 'ws');
    const url = `${hostname}?access_token=${accessToken}`;
    this.socket = new W3CWebSocket(url);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => this.socket.send(JSON.stringify(data)), 5000);

    this.socket.onopen = () => this.emitter.emit('open');
    this.socket.onclose = e => {
      clearInterval(interval);
      this.socket = null;

      if (e.code !== 1000) {
        setTimeout(() => this.connect(), 5000);
      }
    };
    this.socket.onerror = e => {
      console.error('Socket error:', e.message);
      this.socket.close();
    };

    return this.socket;
  }

  public subscribe(collection: string, store: BaseStore<any>, where: any = {}) {
    const _id = uuid();
    const data = {
      _id,
      method: 'subscribe',
      parameters: { collection, resumeToken: queue._id, where },
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
