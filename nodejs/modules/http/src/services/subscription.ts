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
    const webSocket = this.webSocketService.getWebSocket(url);

    // Do not subscribe if request is already registered.
    if (webSocket.hasDurableRequest(request._id)) {
      return null;
    }

    // Set default values for the request.
    request._id ??= uuid();
    request.method = WebSocketMethod.Post;

    webSocket.emitter.on('message', async (message: SubscribeResponse<T>) => {
      // If the response is for a different request, ignore it.
      if (message._id !== request._id || !message.body?.fullDocument) {
        return;
      }

      // If the response contains errors, throw the first one.
      if (message.body.errors) {
        throw new Error(message.body.errors[0].message);
      }

      // Save the resume token if available.
      if (request.body && message.body?.resumeToken) {
        request.body.resumeToken = message.body.resumeToken;
      }

      // Invoke the callback, responding with a NAK if ACKs are enabled.
      if (options.acks && options.callback) {
        try {
          await options.callback(message);
        } catch {
          return this.nak(request._id, url);
        }
      } else if (options.callback) {
        await options.callback(message);
      }

      const record = new Model(message.body.fullDocument);
      if (message.body.operationType === 'delete') {
        service.emitter.emit('delete', record);
        store.remove(record._id);
      } else if (message.body.operationType === 'insert') {
        service.emitter.emit('create', record);
        store.upsertMany([record]);
      } else if (
        message.body.operationType === 'replace' ||
        message.body.operationType === 'update'
      ) {
        service.emitter.emit('update', record);
        store.upsertMany([record]);
      }

      if (options.acks) {
        return this.ack(request._id, url);
      }
    });

    return webSocket.createDurableRequest(request);
  }

  public async unsubscribe(_id: string, url: string) {
    const webSocket = this.webSocketService.getWebSocket(url);
    webSocket.deleteDurableRequest(_id);

    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Delete,
      path: `/subscriptions/${_id}`,
    };
    const response = await this.webSocketService.request(request, url);

    return response._id;
  }

  private async ack(_id: string, url: string) {
    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/acks`,
    };
    const response = await this.webSocketService.request(request, url);

    return response._id;
  }

  private async nak(_id: string, url: string) {
    const request: WebSocketRequest = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/naks`,
    };
    const response = await this.webSocketService.request(request, url);

    return response._id;
  }
}
