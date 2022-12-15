import { QueueModel } from '../models/queue';
import { QueueStore } from '../states/queue';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class QueueService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<QueueModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private queueStore: QueueStore,
  ) {
    this.baseService = new BaseService<QueueModel>(this.apiService, QueueModel, this.queueStore);
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
  public async create(namespaceId: string, json: Partial<QueueModel>) {
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
   * Restarts the Game Server.
   */
  public async restart(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'put',
      url: `${url}/${_id}/restarted-at`,
    });

    const record = new QueueModel(response.data.record);
    this.emitter.emit('update', record);
    this.baseService.addOrReplace(record);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<QueueModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/queues`;
  }
}
