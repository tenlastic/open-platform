import { WebSocketModel } from '../models/web-socket';
import { WebSocketStore } from '../states/web-socket';
import {
  WebSocket,
  WebSocketInterceptors,
  WebSocketRequest,
  WebSocketResponse,
} from '../web-socket';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class WebSocketService {
  public get emitter() {
    return this.baseService.emitter;
  }
  public interceptors: WebSocketInterceptors = { connect: [] };
  public webSockets = new Map<string, WebSocket>();

  private baseService: BaseService<WebSocketModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private webSocketStore: WebSocketStore,
  ) {
    this.baseService = new BaseService<WebSocketModel>(
      this.apiService,
      WebSocketModel,
      this.webSocketStore,
    );
  }

  /**
   * Closes a web socket.
   */
  public close(url: string) {
    const webSocket = this.webSockets.get(url);
    webSocket?.close();

    this.webSockets.delete(url);
  }

  /**
   * Connects a web socket.
   */
  public async connect(url: string): Promise<WebSocket> {
    if (this.webSockets.has(url)) {
      return this.webSockets.get(url);
    }

    const webSocket = new WebSocket(url);
    webSocket.emitter.on('close', () => this.webSockets.delete(url));
    this.webSockets.set(url, webSocket);

    webSocket.interceptors.connect = [...this.interceptors.connect];
    await webSocket.connect();

    return webSocket;
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
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
  public request<T extends WebSocketResponse>(request: WebSocketRequest, url: string) {
    const webSocket = this.webSockets.get(url);

    // Throw an error if the web socket is not connected.
    if (!webSocket) {
      throw new Error(`Web socket not connected to ${url}.`);
    }

    return webSocket.request<T>(request);
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
