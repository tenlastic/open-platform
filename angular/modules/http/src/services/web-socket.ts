import { WebSocketModel } from '../models/web-socket';
import { WebSocketStore } from '../states/web-socket';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class WebSocketService {
  public emitter = new ServiceEventEmitter<WebSocketModel>();

  private baseService: BaseService<WebSocketModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private webSocketStore: WebSocketStore,
  ) {
    this.baseService = new BaseService<WebSocketModel>(
      this.apiService,
      this.emitter,
      WebSocketModel,
      this.webSocketStore,
    );
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any) {
    const url = this.getUrl();
    return this.baseService.count(query, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: BaseServiceFindQuery) {
    const url = this.getUrl();
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string) {
    const url = this.getUrl();
    return this.baseService.findOne(_id, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/web-sockets`;
  }
}
