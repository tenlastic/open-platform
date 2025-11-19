import TypedEmitter from 'typed-emitter';
import { v4 as uuid } from 'uuid';

import { BaseModel } from '../models/base';
import {
  WebSocket,
  WebSocketMethod,
  WebSocketRequest,
  WebSocketResponse,
  WebSocketResponseError,
} from '../web-socket';
import { ServiceEvents } from './base';
import { WebSocketService } from './web-socket';

export interface ServiceWithEmitter<TModel extends BaseModel = BaseModel> {
  emitter: TypedEmitter<ServiceEvents<TModel>>;
}

export interface SubscribeRequestBody {
  operationType?: string[];
  resumeToken?: string;
  startDate?: Date;
  where?: unknown;
}

export interface SubscribeOptions<T extends BaseModel = BaseModel> {
  acks?: boolean;
  callback?: (response: SubscribeResponse<T>) => void | Promise<void>;
}

export type DatabaseOperationType = 'delete' | 'insert' | 'replace' | 'update';

export type SubscribeRequest = WebSocketRequest<SubscribeRequestBody>;

export type SubscribeResponse<TModel extends BaseModel> = WebSocketResponse<
  SubscribeResponseBody<TModel>
>;

interface SubscribeResponseBody<TModel extends BaseModel> {
  documentKey: unknown;
  errors?: WebSocketResponseError[];
  fullDocument?: TModel;
  ns: { coll: string; db: string };
  operationType: DatabaseOperationType;
  resumeToken?: string;
  updateDescription?: {
    removedFields: string[];
    truncatedArrays?: Array<{ field: string; newSize: number }>;
    updatedFields: { [key: string]: unknown };
  };
}

export class SubscriptionService {
  constructor(private webSocketService: WebSocketService) {}

  public async subscribe<T extends BaseModel = BaseModel>(
    Model: new (parameters?: Partial<T>) => T,
    request: SubscribeRequest,
    service: ServiceWithEmitter<T>,
    webSocket: WebSocket,
    options: SubscribeOptions<T> = {},
  ) {
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
            await this.nak(request._id, webSocket);
            return;
          }
        } else if (options.callback) {
          await options.callback(response);
        }

        const record = new Model(response.body.fullDocument);
        if (response.body.operationType === 'delete') {
          service.emitter.emit('delete', record);
        } else if (response.body.operationType === 'insert') {
          service.emitter.emit('create', record);
        } else if (
          response.body.operationType === 'replace' ||
          response.body.operationType === 'update'
        ) {
          service.emitter.emit('update', record);
        }

        if (options.acks) {
          await this.ack(request._id, webSocket);
        }
      },
    );
  }

  public async unsubscribe(_id: string, webSocket: WebSocket) {
    webSocket.deleteDurableRequest(_id);

    const request: WebSocketRequest<void> = {
      _id: uuid(),
      method: WebSocketMethod.Delete,
      path: `/subscriptions/${_id}`,
    };
    return this.webSocketService.request(request, webSocket);
  }

  private async ack(_id: string, webSocket: WebSocket) {
    const request: WebSocketRequest<void> = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/acks`,
    };
    return this.webSocketService.request(request, webSocket);
  }

  private async nak(_id: string, webSocket: WebSocket) {
    const request: WebSocketRequest<void> = {
      _id: uuid(),
      method: WebSocketMethod.Post,
      path: `/subscriptions/${_id}/naks`,
    };
    return this.webSocketService.request(request, webSocket);
  }
}
