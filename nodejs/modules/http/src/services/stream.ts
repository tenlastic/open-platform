import WebSocket from 'isomorphic-ws';
import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel } from '../models/base';
import { EnvironmentService } from './environment';
import { TokenService } from './token';

interface LogsParameters {
  buildId?: string;
  gameServerId?: string;
  nodeId: string;
  queueId?: string;
  since?: Date;
  workflowId?: string;
}

interface Service {
  emitter: TypedEmitter<any>;
}

interface Store {
  add: (record: any) => void;
  remove: (_id: string) => void;
  upsert: (unix: string, record: any) => void;
}

interface SubscribeParameters {
  collection: string;
  operationType?: string[];
  resumeToken?: string;
  where?: any;
}

interface Subscription {
  _id: string;
  logs?: LogsParameters;
  method: 'logs' | 'subscribe';
  Model: any;
  service?: Service;
  store?: Store;
  subscribe?: SubscribeParameters;
  url: string;
}

export class StreamService {
  public _ids: { [url: string]: string } = {};
  public webSockets: { [url: string]: WebSocket } = {};

  private resumeTokens: { [key: string]: string } = {};
  private subscriptions: Subscription[] = [];

  constructor(private environmentService: EnvironmentService, private tokenService: TokenService) {}

  public close(url: string) {
    const socket = this.webSockets[url];
    socket?.close(1000);
  }

  public async connect(url: string) {
    if (this.webSockets[url]) {
      return this.webSockets[url];
    }

    let connectionString = url;

    if (this.environmentService?.apiKey) {
      connectionString += `?api_key=${this.environmentService.apiKey}`;
    } else if (this.tokenService) {
      const accessToken = await this.tokenService.getAccessToken();
      if (!accessToken || accessToken.isExpired) {
        return;
      }

      connectionString += `?access_token=${accessToken.value}`;
    }

    const socket = new WebSocket(connectionString);
    this.webSockets[url] = socket;

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => socket.send(JSON.stringify(data)), 5000);

    socket.addEventListener('close', (e) => {
      clearInterval(interval);

      delete this._ids[url];
      delete this.webSockets[url];

      if (e.code !== 1000) {
        setTimeout(() => this.connect(url), 5000);
      }
    });
    socket.addEventListener('error', () => socket.close());
    socket.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      if (!payload._id && payload.fullDocument && payload.operationType === 'insert') {
        this._ids[url] = payload.fullDocument._id;
      }
    });
    socket.addEventListener('open', () => {
      const logs = this.subscriptions.filter((s) => s.method === 'logs' && s.url === url);
      const subscribe = this.subscriptions.filter((s) => s.method === 'subscribe' && s.url === url);
      this.subscriptions = this.subscriptions.filter((s) => s.url !== url);

      for (const subscription of logs) {
        this.logs(subscription.Model, subscription.logs, subscription.store, subscription.url);
      }

      for (const subscription of subscribe) {
        this.subscribe(
          subscription.Model,
          subscription.subscribe,
          subscription.service,
          subscription.store,
          subscription.url,
        );
      }
    });

    return new Promise<WebSocket>((resolve, reject) => {
      socket.addEventListener('close', reject);
      socket.addEventListener('error', reject);
      socket.addEventListener('open', () => resolve(socket));
    });
  }

  public async getId(url: string) {
    if (this._ids[url]) {
      return this._ids[url];
    }

    return new Promise<string>((resolve) => {
      const socket = this.webSockets[url];

      socket.addEventListener('message', (msg) => {
        const payload = JSON.parse(msg.data);

        if (!payload._id && payload.fullDocument && payload.operationType === 'insert') {
          return resolve(payload.fullDocument._id);
        }
      });
    });
  }

  public async logs(
    Model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: LogsParameters,
    store: Store,
    url: string,
  ) {
    const _id = uuid();
    const data = { _id, method: 'logs', parameters };
    const socket = this.webSockets[url];

    socket.send(JSON.stringify(data));
    socket.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      // If the response is for a different request, ignore it.
      if (payload._id !== _id || !payload.fullDocument) {
        return;
      }

      const record = new Model({ ...payload.fullDocument, ...parameters }) as any;
      store.upsert(record.unix, record);

      const subscription = this.subscriptions.find((s) => s._id === _id);
      subscription.logs.since = new Date(record.unix);
    });

    this.subscriptions.push({ _id, logs: parameters, method: 'logs', Model, store, url });

    return _id;
  }

  public async subscribe(
    Model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: SubscribeParameters,
    service: Service,
    store: Store,
    url: string,
  ) {
    const _id = uuid();
    const data = {
      _id,
      method: 'subscribe',
      parameters: { resumeToken: this.resumeTokens[parameters.collection], ...parameters },
    };
    const socket = this.webSockets[url];

    socket.send(JSON.stringify(data));
    socket.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      if (payload.error) {
        throw new Error(payload.error);
      }

      // If the response is for a different request, ignore it.
      if (payload._id !== _id) {
        return;
      }

      // Save the resume token if available.
      if (payload.resumeToken && !parameters.resumeToken) {
        this.resumeTokens[parameters.collection] = payload.resumeToken;
      }

      const record = new Model(payload.fullDocument);
      if (payload.operationType === 'delete') {
        service.emitter.emit('delete', record);
        store.remove(record._id);
      } else if (payload.operationType === 'insert') {
        service.emitter.emit('create', record);
        store.add(record);
      } else if (payload.operationType === 'update') {
        service.emitter.emit('update', record);
        store.upsert(record._id, record);
      }
    });

    this.subscriptions.push({
      _id,
      method: 'subscribe',
      Model,
      service,
      subscribe: parameters,
      url,
    });

    return _id;
  }

  public async unsubscribe(_id: string, url: string) {
    if (!_id) {
      return;
    }

    const subscription = this.subscriptions.find((s) => s._id === _id);
    const data = { _id, method: subscription.method };

    const index = this.subscriptions.findIndex((s) => s._id === _id);
    this.subscriptions.splice(index, 1);

    const socket = this.webSockets[url];
    socket.send(JSON.stringify(data));
  }
}
