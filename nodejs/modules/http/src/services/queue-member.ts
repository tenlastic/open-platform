import { QueueMemberModel } from '../models/queue-member';
import { QueueMemberStore } from '../states/queue-member';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';
import { Method, StreamRequest, StreamService } from './stream';

export class QueueMemberService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<QueueMemberModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private queueMemberStore: QueueMemberStore,
    private streamService: StreamService,
  ) {
    this.baseService = new BaseService<QueueMemberModel>(
      this.apiService,
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
  public async create(json: Partial<QueueMemberModel>, url: string) {
    const request: StreamRequest = { body: json, method: Method.Post, path: '/queue-members' };
    const response = await this.streamService.request(request, url);

    const record = new QueueMemberModel(response.body.record);
    this.emitter.emit('create', record);
    this.queueMemberStore.upsertMany([record]);

    return record;
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
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/queue-members`
      : `${this.environmentService.apiUrl}/queue-members`;
  }
}
