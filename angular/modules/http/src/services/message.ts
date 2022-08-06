import { MessageModel } from '../models/message';
import { MessageStore } from '../states/message';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class MessageService {
  public emitter = new ServiceEventEmitter<MessageModel>();

  private baseService: BaseService<MessageModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private messageStore: MessageStore,
  ) {
    this.baseService = new BaseService<MessageModel>(
      this.apiService,
      this.emitter,
      MessageModel,
      this.messageStore,
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
  public async create(json: Partial<MessageModel>) {
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
   * Returns a Record by ID.
   */
  public async findOne(_id: string) {
    const url = this.getUrl();
    return this.baseService.findOne(_id, url);
  }

  /**
   * Marks a Message as read by the current User.
   */
  public async read(_id: string): Promise<MessageModel> {
    const url = this.getUrl();
    const response = await this.apiService.observable(
      'post',
      `${url}/${_id}/read-by-user-ids`,
      null,
    );

    const record = new MessageModel(response.record);
    this.emitter.emit('update', record);
    this.messageStore.upsert(_id, record);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<MessageModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/messages`;
  }
}
