import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';
import { BaseLogModel } from '../models';

import { BaseModel } from '../models/base';
import {
  WebSocketMethod,
  WebSocketRequest,
  WebSocketResponse,
  WebSocketResponseError,
} from '../web-socket';
import { WebSocketService } from './web-socket';

export interface LogsRequest extends WebSocketRequest {
  body?: LogsRequestBody;
}

export interface LogsRequestBody {
  since?: Date;
}

export interface SubscribeRequest extends WebSocketRequest {
  body?: SubscribeRequestBody;
}

export interface SubscribeRequestBody {
  operationType?: string[];
  resumeToken?: string;
  where?: any;
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';

interface LogsResponse<T extends BaseLogModel> extends WebSocketResponse {
  body: {
    errors?: WebSocketResponseError[];
    fullDocument?: T;
  };
}

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

  public async logs<T extends BaseLogModel = BaseLogModel>(
    Model: new (parameters?: Partial<BaseModel>) => BaseModel,
    parameters: Partial<T>,
    request: LogsRequest,
    store: Store,
    url: string,
  ) {
    const webSocket = this.webSocketService.getWebSocket(url);

    // Do not subscribe if request is already registered.
    if (webSocket.hasDurableRequest(request._id)) {
      return null;
    }

    // Set default values for the request.
    request._id ??= uuid();
    request.method = WebSocketMethod.Post;

    webSocket.emitter.on('message', (message: LogsResponse<T>) => {
      // If the response is for a different request, ignore it.
      if (message._id !== request._id || !message.body?.fullDocument) {
        return;
      }

      // If the response contains errors, throw the first one.
      if (message.body.errors) {
        throw new Error(message.body.errors[0].message);
      }

      const record = new Model({ ...message.body.fullDocument, ...parameters }) as any;
      store.upsertMany([record]);

      request.body.since = new Date(record.unix);
    });

    return webSocket.createDurableRequest(request);
  }

  public async subscribe<T extends BaseModel = BaseModel>(
    Model: new (parameters?: Partial<T>) => T,
    request: SubscribeRequest,
    service: Service,
    store: Store,
    url: string,
    callback?: (response: SubscribeResponse<T>) => any | Promise<any>,
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

      if (callback) {
        try {
          await callback(message);
        } catch {
          return this.nak(request._id, url);
        }
      }

      return this.ack(request._id, url);
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
