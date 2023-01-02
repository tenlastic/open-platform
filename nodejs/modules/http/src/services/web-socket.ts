import { WebSocketModel } from '../models/web-socket';
import { WebSocketStore } from '../states/web-socket';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class WebSocketService {
  public get emitter() {
    return this.baseService.emitter;
  }

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
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/web-sockets`
      : `${this.environmentService.apiUrl}/web-sockets`;
  }
}
