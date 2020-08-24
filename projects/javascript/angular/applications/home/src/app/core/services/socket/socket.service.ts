import { EventEmitter, Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../environments/environment';
import { IdentityService } from '../identity/identity.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  public OnOpen = new EventEmitter();

  public socket: WebSocket;

  private resumeTokens: { [key: string]: string } = {};

  constructor(private identityService: IdentityService) {}

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

    if (!this.identityService.accessToken || this.identityService.accessTokenJwt.isExpired) {
      return;
    }

    const hostname = environment.apiBaseUrl.replace('http', 'ws');
    const url = `${hostname}?access_token=${this.identityService.accessToken}`;
    this.socket = new WebSocket(url);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => this.socket.send(JSON.stringify(data)), 5000);

    this.socket.onopen = () => this.OnOpen.emit();
    this.socket.onclose = e => {
      clearInterval(interval);
      this.socket = null;

      if (e.code !== 1000) {
        setTimeout(() => this.connect(), 5000);
      }
    };
    this.socket.onerror = (e: any) => {
      console.error('Socket error:', e.message);
      this.socket.close();
    };

    return this.socket;
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

    this.socket.send(JSON.stringify(data));
    this.socket.addEventListener('message', msg => {
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
    const data = { _id, method: 'unsubscribe' };
    this.socket.send(JSON.stringify(data));
  }
}
