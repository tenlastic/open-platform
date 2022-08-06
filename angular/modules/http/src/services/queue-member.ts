import { QueueMemberModel } from '../models/queue-member';
import { QueueMemberStore } from '../states/queue-member';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class QueueMemberService {
  public emitter = new ServiceEventEmitter<QueueMemberModel>();

  private baseService: BaseService<QueueMemberModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private queueMemberStore: QueueMemberStore,
  ) {
    this.baseService = new BaseService<QueueMemberModel>(
      this.apiService,
      this.emitter,
      QueueMemberModel,
      this.queueMemberStore,
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
   * Creates a Record.
   */
  public async create(namespaceId: string, json: Partial<QueueMemberModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.delete(_id, url);
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
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/queue-members`;
  }
}
