import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';

import { IdentityService } from '../identity/identity.service';

interface Subscription {
  _id: string;
  collection: string;
  Model: any;
  service: any;
  where?: any;
}

export class Socket extends WebSocket {
  public subscriptions: Subscription[] = [];

  private resumeTokens: { [key: string]: string } = {};

  public close() {
    super.close(1000);
  }

  public subscribe(collection: string, Model: any, service: any, where: any = {}) {
    const _id = uuid();
    const data = {
      _id,
      method: 'subscribe',
      parameters: {
        collection,
        resumeToken: this.resumeTokens[collection],
        where,
      },
    };

    this.send(JSON.stringify(data));
    this.addEventListener('message', msg => {
      const payload = JSON.parse(msg.data);

      // If the response is for a different request, ignore it.
      if (payload._id !== _id) {
        return;
      }

      // Save the resume token if available.
      if (payload.resumeToken) {
        this.resumeTokens[collection] = payload.resumeToken;
      }

      const record = new Model(payload.fullDocument);
      if (payload.operationType === 'delete') {
        service.onDelete.emit(record);
      } else if (payload.operationType === 'insert') {
        service.onCreate.emit(record);
      } else if (payload.operationType === 'update') {
        service.onUpdate.emit(record);
      }
    });

    this.subscriptions.push({ _id, collection, Model, service, where });

    return _id;
  }

  public unsubscribe(_id: string) {
    const data = { _id, method: 'unsubscribe' };

    const index = this.subscriptions.findIndex(s => s._id === _id);
    this.subscriptions.splice(index, 1);

    this.send(JSON.stringify(data));
  }
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  public get sockets() {
    return this._sockets;
  }

  private _sockets: { [key: string]: Socket } = {};

  constructor(private identityService: IdentityService) {}

  public connect(url: string, subscriptions: Subscription[] = []) {
    if (this._sockets[url]) {
      return this._sockets[url];
    }

    if (!this.identityService.accessToken || this.identityService.accessTokenJwt.isExpired) {
      return;
    }

    const hostname = url.replace('http', 'ws');
    const socket = new Socket(`${hostname}?access_token=${this.identityService.accessToken}`);
    socket.subscriptions = subscriptions;

    this._sockets[url] = socket;

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => socket.send(JSON.stringify(data)), 5000);

    socket.addEventListener('close', e => {
      clearInterval(interval);
      delete this._sockets[url];

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url, socket.subscriptions), 5000);
      }
    });
    socket.addEventListener('error', socket.close);
    socket.addEventListener('open', () => {
      socket.subscriptions = [];

      for (const subscription of subscriptions) {
        const { collection, Model, service, where } = subscription;
        socket.subscribe(collection, Model, service, where);
      }
    });

    return socket;
  }
}
