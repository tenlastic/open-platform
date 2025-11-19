import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { WebSocketModel } from '../models/web-socket';
import {
  WebSocket,
  WebSocketInterceptors,
  WebSocketRequest,
  WebSocketResponse,
} from '../web-socket';
import { ApiService } from './api';
import { BaseService, BaseServiceCountQuery, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export type WebSocketServiceEvents = {
  create: (webSocket: WebSocket) => void;
  delete: (webSocket: WebSocket) => void;
};

export class WebSocketService {
  public get emitter() {
    return this.baseService.emitter;
  }
  public interceptors: WebSocketInterceptors = { connect: [] };
  public onWebSocketsSet = new EventEmitter() as TypedEmitter<WebSocketServiceEvents>;
  public webSockets: WebSocket[] = [];

  private baseService: BaseService<WebSocketModel>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.baseService = new BaseService<WebSocketModel>(this.apiService, WebSocketModel);
  }

  /**
   * Closes a web socket.
   */
  public close(webSocket: WebSocket) {
    if (!webSocket) {
      return;
    }

    webSocket.close();
  }

  /**
   * Connects a web socket.
   */
  public async connect(url: string): Promise<WebSocket> {
    const webSocket = new WebSocket(url);
    webSocket.emitter.on('close', () => {
      const index = this.webSockets.indexOf(webSocket);
      if (index >= 0) {
        this.webSockets.splice(index, 1);
      }

      this.onWebSocketsSet.emit('delete', webSocket);
    });
    this.webSockets.push(webSocket);

    webSocket.interceptors.connect = [...this.interceptors.connect];
    await webSocket.connect();

    this.onWebSocketsSet.emit('create', webSocket);

    return webSocket;
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: BaseServiceCountQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, query: BaseServiceFindQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Sends a request through the web socket.
   */
  public request<TRequest, TResponse>(request: WebSocketRequest<TRequest>, webSocket: WebSocket) {
    return webSocket?.request<TRequest, WebSocketResponse<TResponse>>(request);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/web-sockets`
      : `${this.environmentService.apiUrl}/web-sockets`;
  }
}
