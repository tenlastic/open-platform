import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';

import { IdentityService } from '../identity/identity.service';

export class Socket extends WebSocket {
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

    return _id;
  }

  public unsubscribe(_id: string) {
    if (!this) {
      return;
    }

    const data = { _id, method: 'unsubscribe' };
    this.send(JSON.stringify(data));
  }
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  public OnOpen = new EventEmitter();

  private sockets: { [key: string]: Socket } = {};

  constructor(private identityService: IdentityService) {}

  public connect(url: string) {
    if (this.sockets[url]) {
      return this.sockets[url];
    }

    if (!this.identityService.accessToken || this.identityService.accessTokenJwt.isExpired) {
      return;
    }

    const hostname = url.replace('http', 'ws');
    this.sockets[url] = new Socket(`${hostname}?access_token=${this.identityService.accessToken}`);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => this.sockets[url].send(JSON.stringify(data)), 5000);

    this.sockets[url].onopen = () => this.OnOpen.emit();
    this.sockets[url].onclose = e => {
      clearInterval(interval);
      delete this.sockets[url];

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url), 5000);
      }
    };
    this.sockets[url].onerror = (e: any) => {
      console.error('Socket error:', e.message);
      this.sockets[url].close();
    };

    return this.sockets[url];
  }
}
