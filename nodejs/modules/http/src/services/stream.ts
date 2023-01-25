import WebSocket from 'isomorphic-ws';
import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel } from '../models/base';
import { Jwt } from '../models/jwt';

export enum Method {
  Delete = 'DELETE',
  Get = 'GET',
  Patch = 'PATCH',
  Put = 'PUT',
  Post = 'POST',
}

export interface LogsRequest extends StreamRequest {
  body?: LogsRequestBody;
}
export interface LogsRequestBody {
  since?: Date;
}

export interface StreamRequest {
  _id?: string;
  body?: { [key: string]: any };
  method?: Method;
  path: string;
}

export interface StreamResponse<T = any> {
  _id: string;
  body?: T;
  status?: number;
}

export interface SubscribeRequest extends StreamRequest {
  body?: SubscribeRequestBody;
}

export interface SubscribeRequestBody {
  operationType?: string[];
  resumeToken?: string;
  where?: any;
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';

type ConnectOptions = { url: string } & ({ accessToken: Jwt } | { apiKey: string });

interface ErrorResponse extends StreamResponse {
  body: {
    errors: Array<{ message: string; name: string }>;
  };
}

interface LogsResponse<T = any> extends StreamResponse {
  body: {
    fullDocument?: T;
  };
}

interface ResumeToken {
  expiresAt: Date;
  value: string;
}

interface Service {
  emitter: TypedEmitter<any>;
}

interface Store {
  remove: (_id: string) => void;
  upsertMany: (records: any) => void;
}

interface SubscribeResponse<T = any> extends StreamResponse {
  body: {
    documentKey: any;
    fullDocument?: T;
    ns: { coll: string; db: string };
    operationType: DatabaseOperationType;
    resumeToken?: string;
    updateDescription?: {
      removedFields: string[];
      truncatedArrays?: Array<{ field: string; newSize: number }>;
      updatedFields: { [key: string]: any };
    };
  };
}

interface Subscription {
  callback?: (response: SubscribeResponse) => any;
  method: 'logs' | 'subscribe';
  Model: new (parameters?: Partial<BaseModel>) => BaseModel;
  parameters?: Partial<BaseModel>;
  request: LogsRequest & SubscribeRequest;
  service?: Service;
  store?: Store;
  url: string;
}

export class StreamService {
  public webSockets = new Map<string, WebSocket>();

  private _ids = new Map<string, string>();
  private pendingWebSockets = new Map<string, WebSocket>();
  private resumeTokens: { [key: string]: ResumeToken } = {};
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

    const data: StreamRequest = { _id: uuid(), method: Method.Get, path: '/probes/liveness' };
    const interval = setInterval(() => socket.send(JSON.stringify(data)), 5000);

    socket.addEventListener('close', async (e) => {
      clearInterval(interval);

      this._ids.delete(options.url);
      this.pendingWebSockets.delete(options.url);
      this.webSockets.delete(options.url);

      if (e.code !== 1000) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 5000));

          console.log(`Reconnecting to web socket at ${options.url}...`);
          await this.connect(options);
          console.log(`Successfully reconnected to web socket at ${options.url}.`);
        } catch {
          const error = new Error(`Could not reconnect to web socket at ${options.url}.`);
          console.error(error);
        }
      }
    });
    socket.addEventListener('error', () => socket.close());

    return new Promise<WebSocket>((resolve, reject) => {
      const onMessage = async (msg) => {
        const payload = JSON.parse(msg.data) as SubscribeResponse<any>;
        if (payload._id || payload.status !== 200) {
          return;
        }

        socket.removeEventListener('message', onMessage);
        this.pendingWebSockets.delete(options.url);

        if (payload.body?.fullDocument && payload.body?.operationType === 'insert') {
          this._ids.set(options.url, payload.body.fullDocument._id);
        }

        const subscriptions = this.subscriptions.filter((s) => s.url === options.url);
        const logs = subscriptions.filter((s) => s.method === 'logs');
        const subscribe = subscriptions.filter((s) => s.method === 'subscribe');
        this.subscriptions = this.subscriptions.filter((s) => s.url !== options.url);

        await Promise.all(
          logs.map((l) => this.logs(l.Model, l.parameters, l.request, l.store, l.url)),
        );
        await Promise.all(
          subscribe.map((s) =>
            this.subscribe(s.Model, s.request, s.service, s.store, s.url, s.callback),
          ),
        );

        return resolve(socket);
      };

      socket.addEventListener('close', reject);
      socket.addEventListener('error', reject);
      socket.addEventListener('message', onMessage);
    });
  }

  public async logs<T = any>(
    Model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: Partial<T>,
    request: LogsRequest,
    store: Store,
    url: string,
  ) {
    request._id ??= uuid();
    request.method = Method.Post;

    // If there is already a subscription with this ID, return the ID.
    if (this.subscriptions.some((s) => request._id === s.request._id)) {
      return request._id;
    }

    // Cache the subscription to resubscribe when reconnected.
    this.subscriptions.push({ method: 'logs', Model, parameters, request, store, url });

    // Wait until web socket is connected to subscribe.
    if (this.pendingWebSockets.has(url) || !this.webSockets.has(url)) {
      return request._id;
    }

    const socket = this.webSockets.get(url);

    socket?.send(JSON.stringify(request));
    socket?.addEventListener('message', (msg) => {
      const json = JSON.parse(msg.data) as ErrorResponse & LogsResponse<T>;

      // If the response is for a different request, ignore it.
      if (request._id !== json._id || !json.body?.fullDocument) {
        return;
      }

      if (json.body.errors) {
        throw new Error(json.body.errors[0].message);
      }

      const record = new Model({ ...json.body.fullDocument, ...parameters }) as any;
      store.upsertMany([record]);

      const subscription = this.subscriptions.find((s) => request._id === s.request._id);
      subscription.request.body.since = new Date(record.unix);
    });

    const response = await this.response<LogsResponse>(request._id, socket);
    return response._id;
  }

  public async request<T = { [key: string]: any }>(request: StreamRequest, url: string) {
    request._id ??= uuid();

    const socket = this.webSockets.get(url);
    socket?.send(JSON.stringify(request));

    const response = await this.response<StreamResponse<T>>(request._id, socket);
    return response;
  }

  public async subscribe<T extends BaseModel = any>(
    Model: new (parameters?: Partial<T>) => T,
    request: SubscribeRequest,
    service: Service,
    store: Store,
    url: string,
    callback?: (response: SubscribeResponse<T>) => any,
  ) {
    request._id ??= uuid();
    request.method = Method.Post;

    // Add the resume token.
    const resumeToken = this.getResumeToken(request._id);
    if (request.body && resumeToken) {
      request.body = { resumeToken, ...request.body };
    }

    if (this.subscriptions.some((s) => request._id === s.request._id)) {
      return request._id;
    }

    // Cache the subscription to resubscribe when reconnected.
    this.subscriptions.push({ callback, method: 'subscribe', Model, request, service, store, url });

    // Wait until web socket is connected to subscribe.
    if (this.pendingWebSockets.has(url) || !this.webSockets.has(url)) {
      return request._id;
    }

    const socket = this.webSockets.get(url);

    socket?.send(JSON.stringify(request));
    socket?.addEventListener('message', async (msg) => {
      const json = JSON.parse(msg.data) as ErrorResponse & SubscribeResponse<T>;

      // If the response is for a different request, ignore it.
      if (request._id !== json._id || !json.body?.fullDocument) {
        return;
      }

      if (json.body.errors) {
        throw new Error(json.body.errors[0].message);
      }

      // Save the resume token if available.
      if (!request.body?.resumeToken && json.body?.resumeToken) {
        this.setResumeToken(request._id, json.body.resumeToken);
      }

      const record = new Model(json.body.fullDocument);
      if (json.body.operationType === 'delete') {
        service.emitter.emit('delete', record);
        store.remove(record._id);
      } else if (json.body.operationType === 'insert') {
        service.emitter.emit('create', record);
        store.upsertMany([record]);
      } else if (json.body.operationType === 'replace' || json.body.operationType === 'update') {
        service.emitter.emit('update', record);
        store.upsertMany([record]);
      }

      if (callback) {
        try {
          await callback(json);
        } catch {
          return this.nak(request._id, url);
        }
      }

      return this.ack(request._id, url);
    });

    const response = await this.response<SubscribeResponse>(request._id, socket);
    return response._id;
  }

  public async unsubscribe(_id: string, url: string) {
    if (!_id) {
      return;
    }

    const index = this.subscriptions.findIndex((s) => _id === s.request._id);
    this.subscriptions.splice(index, index >= 0 ? 1 : 0);

    const request: StreamRequest = {
      _id: uuid(),
      method: Method.Delete,
      path: `/subscriptions/${_id}`,
    };

    const socket = this.webSockets.get(url);
    socket?.send(JSON.stringify(request));

    const response = await this.response(request._id, socket);
    return response._id;
  }

  private async ack(_id: string, url: string) {
    if (!_id) {
      return;
    }

    const request: StreamRequest = {
      _id: uuid(),
      method: Method.Post,
      path: `/subscriptions/${_id}/acks`,
    };

    const socket = this.webSockets.get(url);
    socket?.send(JSON.stringify(request));

    const response = await this.response(request._id, socket);
    return response._id;
  }

  private getResumeToken(_id: string) {
    const now = new Date();

    const resumeToken = this.resumeTokens[_id];
    if (resumeToken && now >= resumeToken.expiresAt) {
      return resumeToken.value;
    }

    return null;
  }

  private async nak(_id: string, url: string) {
    if (!_id) {
      return;
    }

    const request: StreamRequest = {
      _id: uuid(),
      method: Method.Post,
      path: `/subscriptions/${_id}/naks`,
    };

    const socket = this.webSockets.get(url);
    socket?.send(JSON.stringify(request));

    const response = await this.response(request._id, socket);
    return response._id;
  }

  private response<T extends StreamResponse = StreamResponse>(_id: string, socket: WebSocket) {
    return new Promise<T>((resolve, reject) => {
      const onMessage = (msg) => {
        const response = JSON.parse(msg.data) as ErrorResponse & T;

        // If the response is for a different request, ignore it.
        if (_id !== response._id || !response.status) {
          return;
        }

        socket.removeEventListener('message', onMessage);

        if (response.status >= 400 && response.body?.errors) {
          return reject(response.body.errors[0].message);
        } else if (response.status >= 400) {
          return reject(`Unhandled error response from web socket: ${response.status}.`);
        } else {
          return resolve(response);
        }
      };

      socket?.addEventListener('message', onMessage);
    });
  }

  private setResumeToken(_id: string, value: string) {
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
    this.resumeTokens[_id] = { expiresAt, value };
  }
}
