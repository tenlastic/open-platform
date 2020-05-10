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

  public watch(Model: any, service: any, watch: any) {
    if (!this.identityService.accessToken || this.identityService.accessTokenJwt.isExpired) {
      return;
    }

    service.emitEvents = false;

    const url = new URL(service.basePath.replace('http', 'ws'));
    const urlWithoutSearchString = url.href.replace(url.search, '');

    const query = {} as any;
    if (this.resumeTokens[urlWithoutSearchString]) {
      query.resumeToken = this.resumeTokens[urlWithoutSearchString];
    }
    query.token = this.identityService.accessToken;
    if (watch) {
      query.watch = watch;
    }
    url.searchParams.append('query', JSON.stringify(query));

    const socket = new WebSocket(url.href);
    this.sockets.push(socket);

    const interval = setInterval(() => socket.send('42["ping"]'), 5000);

    socket.onmessage = msg => {
      const payload = JSON.parse(msg.data);

      if (payload.resumeToken) {
        this.resumeTokens[urlWithoutSearchString] = payload.resumeToken;
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
      clearInterval(interval);

      const index = this.sockets.indexOf(socket);
      this.sockets.splice(index, 1);

      setTimeout(() => this.watch(Model, service, watch), 5000);
    };

    socket.onerror = (e: any) => {
      console.error('Socket error:', e.message);
      socket.close();
    };

    return socket;
  }
}
