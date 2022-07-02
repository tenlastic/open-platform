import { Injectable } from '@angular/core';
import { v4 as uuid } from 'uuid';

import { IdentityService } from '../identity/identity.service';

export interface LogsParameters {
  buildId?: string;
  databaseId?: string;
  gameServerId?: string;
  namespaceId?: string;
  nodeId: string;
  queueId?: string;
  since?: Date;
  workflowId?: string;
}

interface SubscribeParameters {
  collection: string;
  where?: any;
}

interface Subscription {
  _id: string;
  logs?: LogsParameters;
  method: 'logs' | 'subscribe';
  Model: any;
  service: any;
  subscribe?: SubscribeParameters;
}

export class Socket extends WebSocket {
  public _id: string;
  public resumeTokens: { [key: string]: string } = {};
  public subscriptions: Subscription[] = [];

  public close() {
    super.close(1000);
  }

  public async logs(Model: any, parameters: LogsParameters, service: any) {
    const _id = uuid();
    const data = { _id, method: 'logs', parameters };

    this.send(JSON.stringify(data));
    this.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      // If the response is for a different request, ignore it.
      if (payload._id !== _id || !payload.fullDocument) {
        return;
      }

      const record = new Model({ ...payload.fullDocument, ...parameters });
      service.onLogs.emit([record]);

      const subscription = this.subscriptions.find((s) => s._id === _id);
      subscription.logs.since = new Date(record.unix);
    });

    this.subscriptions.push({ _id, logs: parameters, method: 'logs', Model, service });

    return _id;
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
    this.addEventListener('message', (msg) => {
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

    this.subscriptions.push({
      _id,
      method: 'subscribe',
      Model,
      service,
      subscribe: { collection, where },
    });

    return _id;
  }

  public unsubscribe(_id: string) {
    const subscription = this.subscriptions.find((s) => s._id === _id);
    const data = { _id, method: subscription.method };

    const index = this.subscriptions.findIndex((s) => s._id === _id);
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

  public async connect(
    url: string,
    resumeTokens: { [key: string]: string } = {},
    subscriptions: Subscription[] = [],
  ) {
    const accessToken = await this.identityService.getAccessToken();
    if (!accessToken || accessToken.isExpired) {
      return;
    }

    if (this._sockets[url]) {
      return this._sockets[url];
    }

    const hostname = url.replace('http', 'ws');
    const socket = new Socket(`${hostname}?access_token=${accessToken.value}`);
    socket.resumeTokens = resumeTokens;
    socket.subscriptions = subscriptions;

    this._sockets[url] = socket;

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => socket.send(JSON.stringify(data)), 5000);

    socket.addEventListener('close', (e) => {
      clearInterval(interval);
      delete this._sockets[url];

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url, socket.resumeTokens, socket.subscriptions), 5000);
      }
    });
    socket.addEventListener('error', socket.close);
    socket.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      if (!payload._id && payload.fullDocument && payload.operationType === 'insert') {
        socket._id = payload.fullDocument._id;
      }
    });
    socket.addEventListener('open', () => {
      socket.subscriptions = [];

      for (const subscription of subscriptions.filter((s) => s.method === 'logs')) {
        const { Model, service } = subscription;
        socket.logs(Model, subscription.logs, service);
      }

      for (const subscription of subscriptions.filter((s) => s.method === 'subscribe')) {
        const { Model, service } = subscription;
        const { collection, where } = subscription.subscribe;
        socket.subscribe(collection, Model, service, where);
      }
    });

    return socket;
  }
}
