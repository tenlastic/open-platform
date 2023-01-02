import { MessageModel } from '../models/message';
import { MessageStore } from '../states/message';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class MessageService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<MessageModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private messageStore: MessageStore,
  ) {
    this.baseService = new BaseService<MessageModel>(
      this.apiService,
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
    const response = await this.apiService.request({
      method: 'post',
      url: `${url}/${_id}/read-by-user-ids`,
    });

    const record = new MessageModel(response.data.record);
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
