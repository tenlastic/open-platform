import { IgnorationModel } from '../models/ignoration';
import { IgnorationStore } from '../states/ignoration';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class IgnorationService {
  public emitter = new ServiceEventEmitter<IgnorationModel>();

  private baseService: BaseService<IgnorationModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private ignorationStore: IgnorationStore,
  ) {
    this.baseService = new BaseService<IgnorationModel>(
      this.apiService,
      this.emitter,
      IgnorationModel,
      this.ignorationStore,
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
   * Creates a Record.
   */
  public async create(json: Partial<IgnorationModel>) {
    const url = this.getUrl();
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string) {
    const url = this.getUrl();
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: BaseServiceFindQuery) {
    const url = this.getUrl();
    return this.baseService.find(query, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/ignorations`;
  }
}
