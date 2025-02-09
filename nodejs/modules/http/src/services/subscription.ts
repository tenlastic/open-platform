import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel } from '../models/base';
import {
  WebSocketMethod,
  WebSocketRequest,
  WebSocketResponse,
  WebSocketResponseError,
} from '../web-socket';
import { WebSocketService } from './web-socket';

export interface SubscribeRequest extends WebSocketRequest {
  body?: SubscribeRequestBody;
}

export interface SubscribeRequestBody {
  operationType?: string[];
  resumeToken?: string;
  startDate?: Date;
  where?: any;
}

export interface SubscribeOptions<T extends BaseModel> {
  acks?: boolean;
  callback?: (response: SubscribeResponse<T>) => any | Promise<any>;
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';

interface Service {
  emitter: TypedEmitter<any>;
}

interface Store {
  remove: (_id: string) => void;
  upsertMany: (records: any) => void;
}

interface SubscribeResponse<T extends BaseModel> extends WebSocketResponse {
  body: {
    documentKey: any;
    errors?: WebSocketResponseError[];
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

export class SubscriptionService {
  constructor(private webSocketService: WebSocketService) {}

  public async subscribe<T extends BaseModel = BaseModel>(
    Model: new (parameters?: Partial<T>) => T,
    request: SubscribeRequest,
    service: Service,
    store: Store,
    url: string,
    options: SubscribeOptions<T> = {},
  ) {
    const webSocket = this.webSocketService.webSockets.get(url);

    // Throw an error if the web socket is not connected.
    if (!webSocket) {
      throw new Error(`Web socket not connected to ${url}.`);
    }

    // Do not subscribe if request is already registered.
    if (webSocket.hasDurableRequest(request._id)) {
      return null;
    }

    // Set default values for the request.
    request._id ??= uuid();
    request.method = WebSocketMethod.Post;

    let resumeToken = request.body?.resumeToken;
    let resumeTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    return webSocket.createDurableRequest(
      request._id,
      () => {
        if (resumeToken && resumeTokenExpiresAt.getTime() <= Date.now()) {
          const body = { ...request.body, resumeToken };
          request.body = body;
        }

        return request;
      },
      async (response: SubscribeResponse<T>) => {
        // If the response does not include a full document, ignore it.
        if (!response.body?.fullDocument) {
          return;
        }

        // If the response contains errors, throw the first one.
        if (response.body.errors) {
          throw new Error(response.body.errors[0].message);
        }

        // Save the resume token if available.
        if (response.body?.resumeToken) {
          resumeToken = response.body.resumeToken;
          resumeTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
        }

        // Invoke the callback, responding with a NAK if ACKs are enabled.
        if (options.acks && options.callback) {
          try {
            await options.callback(response);
          } catch {
            return this.nak(request._id, url);
          }
        } else if (options.callback) {
          await options.callback(response);
        }

        const record = new Model(response.body.fullDocument);
        if (response.body.operationType === 'delete') {
          service.emitter.emit('delete', record);
          store.remove(record._id);
        } else if (response.body.operationType === 'insert') {
          service.emitter.emit('create', record);
          store.upsertMany([record]);
        } else if (
          response.body.operationType === 'replace' ||
          response.body.operationType === 'update'
        ) {
          service.emitter.emit('update', record);
          store.upsertMany([record]);
        }

        if (options.acks) {
          await this.ack(request._id, url);
        }
      },
    );
  }

  public async unsubscribe(_id: string, url: string) {
    const webSocket = this.webSocketService.webSockets.get(url);

    // Throw an error if the web socket is not connected.
    if (!webSocket) {
      throw new Error(`Web socket not connected to ${url}.`);
    }

    webSocket.deleteDurableRequest(_id);

    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Delete,
      path: `/subscriptions/${_id}`,
    };
    return this.webSocketService.request(request, url);
  }

  private async ack(_id: string, url: string) {
    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/acks`,
    };
    return this.webSocketService.request(request, url);
  }

  private async nak(_id: string, url: string) {
    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/naks`,
    };
    return this.webSocketService.request(request, url);
  }
}
