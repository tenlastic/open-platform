import { Injectable } from '@angular/core';

import { IdentityService } from '../identity/identity.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private sockets: WebSocket[] = [];
  private resumeTokens: { [key: string]: string } = {};

  constructor(private identityService: IdentityService) {}

  public closeAll() {
    this.sockets.forEach(s => s.close());
    this.sockets = [];
  }

  public watch(Model: any, service: any, query: any) {
    if (!this.identityService.accessToken || this.identityService.accessTokenJwt.isExpired) {
      return;
    }

    service.emitEvents = false;

    const url = new URL(service.basePath.replace('http', 'ws'));
    if (this.resumeTokens[url.href]) {
      url.searchParams.append('resumeToken', this.resumeTokens[url.href]);
    }
    url.searchParams.append('token', this.identityService.accessToken);
    if (query) {
      url.searchParams.append('watch', JSON.stringify(query));
    }

    const socket = new WebSocket(url.href);
    socket.onmessage = msg => {
      const payload = JSON.parse(msg.data);

      if (payload.resumeToken) {
        this.resumeTokens[url.href] = payload.resumeToken;
      }

      const record = new Model(payload.fullDocument);
      if (payload.operationType === 'delete') {
        service.onDelete.emit(record);
      } else if (payload.operationType === 'insert') {
        service.onCreate.emit(record);
      } else if (payload.operationType === 'update') {
        service.onUpdate.emit(record);
      }
    };

    socket.onclose = e => {
      const index = this.sockets.indexOf(socket);
      this.sockets.splice(index, 1);

      setTimeout(() => this.watch(Model, service, query), 5000);
    };

    socket.onerror = (e: any) => {
      console.error('Socket error:', e.message);
      socket.close();
    };

    return socket;
  }
}
