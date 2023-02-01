import wait from '@tenlastic/wait';
import { EventEmitter } from 'events';
import IsomorphicWS from 'isomorphic-ws';
import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel, WebSocketModel } from './models';

export enum WebSocketMethod {
  Delete = 'DELETE',
  Get = 'GET',
  Patch = 'PATCH',
  Put = 'PUT',
  Post = 'POST',
}

export interface WebSocketInterceptors {
  connect: WebSocketConnectInterceptor[];
}

export interface WebSocketRequest {
  _id?: string;
  body?: { [key: string]: any };
  method?: WebSocketMethod;
  path: string;
}

export interface WebSocketResponse {
  _id: string;
  body?: WebSocketResponseBody;
  status: number;
}

export interface WebSocketResponseBody {
  errors?: WebSocketResponseError[];
  fullDocument?: BaseModel;
}

export interface WebSocketResponseError {
  message: string;
  name: string;
}

export type WebSocketConnectInterceptor = (url: string) => string | Promise<string>;

export type WebSocketDurableRequest = () => WebSocketRequest | Promise<WebSocketRequest>;
export type WebSocketDurableResponse = (response: WebSocketResponse) => any | Promise<any>;

export type WebSocketEvents = {
  close: (status: number) => void;
  message: (message: WebSocketResponse) => void;
  open: (webSocket: WebSocketModel) => void;
};

export class WebSocket {
  public emitter = new EventEmitter() as TypedEmitter<WebSocketEvents>;
  public interceptors: WebSocketInterceptors = { connect: [] };
  public get readyState() {
    return this.webSocket ? this.webSocket.readyState : 0;
  }

  private durableRequests = new Map<string, WebSocketDurableRequest>();
  private durableResponses = new Map<string, WebSocketDurableResponse>();
  private interval: ReturnType<typeof setInterval>;
  private url: string;
  private webSocket: IsomorphicWS;

  constructor(url: string) {
    this.emitter.setMaxListeners(25);
    this.url = url;
  }

  public close(status = 1000) {
    clearInterval(this.interval);

    this.emitter.emit('close', status);
    this.webSocket.close(status);
  }

  public async connect() {
    let url = this.url;
    for (const interceptor of this.interceptors.connect) {
      url = await interceptor(url);
    }

    this.webSocket = new IsomorphicWS(`${url}`);

    clearInterval(this.interval);
    this.interval = setInterval(() => this.ping(), 5 * 1000);

    this.webSocket.addEventListener('message', (message) => {
      const response = JSON.parse(message.data) as WebSocketResponse;
      this.emitter.emit('message', response);
    });

    return new Promise<WebSocketModel>((resolve, reject) => {
      const onError = (err) => {
        this.webSocket.removeEventListener('close', onError);
        this.webSocket.removeEventListener('error', onError);
        this.webSocket.removeEventListener('message', onMessage);

        return reject(err);
      };
      const onMessage = async (message) => {
        const response = JSON.parse(message.data) as WebSocketResponse;
        if (response._id || response.status !== 200) {
          return;
        }

        this.webSocket.removeEventListener('close', onError);
        this.webSocket.removeEventListener('error', onError);
        this.webSocket.removeEventListener('message', onMessage);

        const webSocket = response.body?.fullDocument as WebSocketModel;
        this.emitter.emit('open', webSocket);
        this.emitter.removeAllListeners('open');

        const durableRequests = this.durableRequests.values();
        for (const durableRequest of durableRequests) {
          const request = await durableRequest();
          this.send(request);
        }

        return resolve(webSocket);
      };

      this.webSocket.addEventListener('close', onError);
      this.webSocket.addEventListener('error', onError);
      this.webSocket.addEventListener('message', onMessage);
    });
  }

  public async createDurableRequest<T extends WebSocketResponse>(
    _id: string,
    durableRequest: WebSocketDurableRequest,
    durableResponse?: WebSocketDurableResponse,
  ) {
    // Make sure the web socket exists.
    await wait(100, 5 * 1000, () => this.webSocket);

    if (this.webSocket?.readyState === 1) {
      const request = await durableRequest();
      this.send(request);
    }

    this.durableRequests.set(_id, durableRequest);

    if (durableResponse) {
      const callback = (message: WebSocketResponse) => {
        // If the response is for a different request, ignore it.
        if (_id !== message._id) {
          return;
        }

        return durableResponse(message);
      };

      this.durableResponses.set(_id, callback);
      this.emitter.on('message', callback);
    }

    return this.response<T>(_id);
  }

  public deleteDurableRequest(_id: string) {
    this.durableRequests.delete(_id);

    const durableResponse = this.durableResponses.get(_id);
    if (durableResponse) {
      this.durableResponses.delete(_id);
      this.emitter.off('message', durableResponse);
    }
  }

  public hasDurableRequest(_id: string) {
    return this.durableRequests.has(_id);
  }

  public async request<T extends WebSocketResponse>(request: WebSocketRequest) {
    // Make sure the web socket exists.
    await wait(100, 5 * 1000, () => this.webSocket);

    if (this.webSocket?.readyState === 1) {
      this.send(request);
    } else {
      this.emitter.on('open', () => this.send(request));
    }

    return this.response<T>(request._id);
  }

  private async ping() {
    if (this.webSocket.readyState > 1) {
      try {
        return await this.connect();
      } catch {
        const error = new Error(`Could not reconnect to web socket at ${this.url}.`);
        console.error(error);
      }
    }

    if (this.webSocket.readyState === 1) {
      const request: WebSocketRequest = {
        _id: uuid(),
        method: WebSocketMethod.Get,
        path: '/probes/liveness',
      };
      this.send(request);
    }
  }

  private async response<T extends WebSocketResponse>(_id: string) {
    return new Promise<T>((resolve, reject) => {
      const onMessage = (message) => {
        const response = JSON.parse(message.data) as T;

        // If the response is for a different request, ignore it.
        if (_id !== response._id || !response.status) {
          return;
        }

        this.webSocket.removeEventListener('message', onMessage);

        if (response.status >= 400 && response.body?.errors) {
          const error = new Error(response.body.errors[0].message);
          return reject(error);
        } else if (response.status >= 400) {
          const error = new Error(`Unhandled error response from web socket: ${response.status}.`);
          return reject(error);
        }

        return resolve(response);
      };

      this.webSocket.addEventListener('message', onMessage);
    });
  }

  private send(request: WebSocketRequest) {
    const json = JSON.stringify(request);
    this.webSocket.send(json);
  }
}
