import WebSocket from 'isomorphic-ws';
import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel } from '../models/base';
import { Jwt } from '../models/jwt';

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';

export interface IPayload<T> {
  _id: string;
  documentKey: any;
  error?: string;
  fullDocument?: T;
  ns: { coll: string; db: string };
  operationType: DatabaseOperationType;
  resumeToken?: string;
  updateDescription?: {
    removedFields: string[];
    truncatedArrays?: Array<{ field: string; newSize: number }>;
    updatedFields: { [key: string]: any };
  };
}

type ConnectOptions = { url: string } & ({ accessToken: Jwt } | { apiKey: string });

interface LogsParameters {
  _id?: string;
  buildId?: string;
  container: string;
  gameServerId?: string;
  namespaceId?: string;
  pod: string;
  queueId?: string;
  since?: Date;
  workflowId?: string;
}

interface Service {
  emitter: TypedEmitter<any>;
}

interface Store {
  remove: (_id: string) => void;
  upsertMany: (records: any) => void;
}

interface SubscribeParameters {
  _id?: string;
  collection: string;
  operationType?: string[];
  resumeToken?: string;
  where?: any;
}

interface Subscription {
  _id: string;
  logs?: LogsParameters;
  method: 'logs' | 'subscribe';
  model: any;
  service?: Service;
  store?: Store;
  subscribe?: SubscribeParameters;
  url: string;
}

export class StreamService {
  public _ids = new Map<string, string>();
  public webSockets = new Map<string, WebSocket>();

  private pendingWebSockets = new Map<string, WebSocket>();
  private resumeTokens: { [key: string]: string } = {};
  private subscriptions: Subscription[] = [];

  public close(url: string) {
    this.subscriptions = this.subscriptions.filter((s) => s.url !== url);

    const socket = this.webSockets.get(url);
    socket?.close(1000);

    this.pendingWebSockets.delete(url);
    this.webSockets.delete(url);
  }

  public async connect(options: ConnectOptions) {
    if (this.webSockets.has(options.url)) {
      return this.webSockets.get(options.url);
    }

    let connectionString = options.url;
    if ('apiKey' in options && options.apiKey) {
      connectionString += `?api_key=${options.apiKey}`;
    } else if ('accessToken' in options && options.accessToken && !options.accessToken.isExpired) {
      connectionString += `?access_token=${options.accessToken.value}`;
    } else {
      return;
    }

    const socket = new WebSocket(connectionString);
    this.pendingWebSockets.set(options.url, socket);
    this.webSockets.set(options.url, socket);

    const data = { _id: uuid(), method: 'ping' };
    const interval = setInterval(() => socket.send(JSON.stringify(data)), 5000);

    socket.addEventListener('close', async (e) => {
      clearInterval(interval);

      this._ids.delete(options.url);
      this.pendingWebSockets.delete(options.url);
      this.webSockets.delete(options.url);

      if (e.code !== 1000) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          await this.connect(options);
        } catch {
          console.error(`Could not reconnect to web socket at ${options.url}.`);
        }
      }
    });
    socket.addEventListener('error', () => socket.close());

    return new Promise<WebSocket>((resolve, reject) => {
      const onMessage = async (msg) => {
        const payload = JSON.parse(msg.data);
        if (payload._id !== 0 || payload.status !== 200) {
          return;
        }

        socket.removeEventListener('message', onMessage);
        this.pendingWebSockets.delete(options.url);

        if (payload.fullDocument && payload.operationType === 'insert') {
          this._ids.set(options.url, payload.fullDocument._id);
        }

        const subscriptions = this.subscriptions.filter((s) => s.url === options.url);
        const logs = subscriptions.filter((s) => s.method === 'logs');
        const subscribe = subscriptions.filter((s) => s.method === 'subscribe');
        this.subscriptions = this.subscriptions.filter((s) => s.url !== options.url);

        await Promise.all(logs.map((l) => this.logs(l.model, l.logs, l.store, l.url)));
        await Promise.all(
          subscribe.map((s) => this.subscribe(s.model, s.subscribe, s.service, s.store, s.url)),
        );

        return resolve(socket);
      };

      socket.addEventListener('close', reject);
      socket.addEventListener('error', reject);
      socket.addEventListener('message', onMessage);
    });
  }

  public async getId(url: string) {
    if (this._ids.has(url)) {
      return this._ids.get(url);
    }

    return new Promise<string>((resolve) => {
      const socket = this.webSockets.get(url);

      const onMessage = async (msg) => {
        const payload = JSON.parse(msg.data);
        if (payload._id !== 0 || payload.status !== 200) {
          return;
        }

        if (payload.fullDocument && payload.operationType === 'insert') {
          socket.removeEventListener('message', onMessage);
          return resolve(payload.fullDocument._id);
        }
      };

      socket.addEventListener('message', onMessage);
    });
  }

  public async logs(
    model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: LogsParameters,
    store: Store,
    url: string,
  ) {
    const _id = parameters._id || uuid();
    if (this.subscriptions.some((s) => s._id === _id)) {
      return _id;
    }

    // Cache the subscription to resubscribe when reconnected.
    this.subscriptions.push({ _id, logs: parameters, method: 'logs', model, store, url });

    // Wait until web socket is connected to subscribe.
    if (this.pendingWebSockets.has(url) || !this.webSockets.has(url)) {
      return _id;
    }

    const data = { _id, method: 'logs', parameters };
    const socket = this.webSockets.get(url);

    socket?.send(JSON.stringify(data));
    socket?.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data);

      // If the response is for a different request, ignore it.
      if (payload._id !== _id || !payload.fullDocument) {
        return;
      }

      if (payload.error) {
        throw new Error(payload.error);
      }

      const record = new model({ ...payload.fullDocument, ...parameters }) as any;
      store.upsertMany([record]);

      const subscription = this.subscriptions.find((s) => s._id === _id);
      subscription.logs.since = new Date(record.unix);
    });

    return _id;
  }

  public async subscribe<T = any>(
    model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: SubscribeParameters,
    service: Service,
    store: Store,
    url: string,
    callback?: (payload: IPayload<T>) => any,
  ) {
    const _id = parameters._id || uuid();
    if (this.subscriptions.some((s) => s._id === _id)) {
      return _id;
    }

    // Cache the subscription to resubscribe when reconnected.
    this.subscriptions.push({
      _id,
      method: 'subscribe',
      model,
      service,
      store,
      subscribe: parameters,
      url,
    });

    // Wait until web socket is connected to subscribe.
    if (this.pendingWebSockets.has(url) || !this.webSockets.has(url)) {
      return _id;
    }

    const data = {
      _id,
      method: 'subscribe',
      parameters: { resumeToken: this.resumeTokens[parameters.collection], ...parameters },
    };
    const socket = this.webSockets.get(url);

    socket?.send(JSON.stringify(data));
    socket?.addEventListener('message', (msg) => {
      const payload = JSON.parse(msg.data) as IPayload<T>;

      // If the response is for a different request, ignore it.
      if (payload._id !== _id) {
        return;
      }

      if (payload.error) {
        throw new Error(payload.error);
      }

      // Save the resume token if available.
      if (payload.resumeToken && !parameters.resumeToken) {
        this.resumeTokens[parameters.collection] = payload.resumeToken;
      }

      const record = new model(payload.fullDocument);
      if (payload.operationType === 'delete') {
        service.emitter.emit('delete', record);
        store.remove(record._id);
      } else if (payload.operationType === 'insert') {
        service.emitter.emit('create', record);
        store.upsertMany([record]);
      } else if (payload.operationType === 'replace' || payload.operationType === 'update') {
        service.emitter.emit('update', record);
        store.upsertMany([record]);
      }

      return callback ? callback(payload) : null;
    });

    return _id;
  }

  public unsubscribe(_id: string, url: string) {
    if (!_id) {
      return;
    }

    const subscription = this.subscriptions.find((s) => s._id === _id);
    if (!subscription) {
      return;
    }

    const data = { _id, method: subscription.method };

    const index = this.subscriptions.findIndex((s) => s._id === _id);
    this.subscriptions.splice(index, 1);

    const socket = this.webSockets.get(url);
    socket?.send(JSON.stringify(data));
  }
}
