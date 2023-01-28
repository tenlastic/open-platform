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

export type WebSocketEvents = {
  close: (status: number) => void;
  message: (message: WebSocketResponse) => void;
  open: (webSocket: WebSocketModel) => void;
};

export class WebSocket {
  public emitter = new EventEmitter() as TypedEmitter<WebSocketEvents>;
  public get readyState() {
    return this.webSocket ? this.webSocket.readyState : 0;
  }

  private requests = new Map<string, WebSocketRequest>();
  private url: string;
  private webSocket: IsomorphicWS;

  constructor(url: string) {
    this.url = url;
  }

  public close(status = 1000) {
    this.emitter.emit('close', status);
    this.webSocket.close(status);
  }

  public async connect() {
    this.webSocket = new IsomorphicWS(this.url);

    const data: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Get,
      path: '/probes/liveness',
    };
    const interval = setInterval(() => this.send(data), 5000);

    this.webSocket.addEventListener('close', async (e) => {
      clearInterval(interval);

      if (e.code !== 1000) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          await this.connect();
        } catch {
          const error = new Error(`Could not reconnect to web socket at ${this.url}.`);
          console.error(error);
        }
      }
    });
    this.webSocket.addEventListener('error', () => this.webSocket.close());
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

        const webSocket = response.body.fullDocument as WebSocketModel;
        this.emitter.emit('open', webSocket);
        this.emitter.removeAllListeners('open');

        const requests = this.requests.values();
        for (const request of requests) {
          this.send(request);
        }

        return resolve(webSocket);
      };

      this.webSocket.addEventListener('close', onError);
      this.webSocket.addEventListener('error', onError);
      this.webSocket.addEventListener('message', onMessage);
    });
  }

  public createDurableRequest<T extends WebSocketResponse>(request: WebSocketRequest) {
    if (this.webSocket.readyState === 1) {
      this.send(request);
    }

    this.requests.set(request._id, request);

    return this.response<T>(request._id);
  }

  public deleteDurableRequest(_id: string) {
    this.requests.delete(_id);
  }

  public hasDurableRequest(_id: string) {
    return this.requests.has(_id);
  }

  public request<T extends WebSocketResponse>(request: WebSocketRequest) {
    if (this.webSocket.readyState === 1) {
      this.send(request);
    } else {
      this.emitter.on('open', () => this.send(request));
    }

    return this.response<T>(request._id);
  }

  private response<T extends WebSocketResponse>(_id: string) {
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
