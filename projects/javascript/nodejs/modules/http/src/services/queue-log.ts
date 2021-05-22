import { apiUrl } from '../api-url';
import { QueueLogModel } from '../models/queue-log';
import { BaseService, ServiceEventEmitter } from './base';

export class QueueLogService {
  public emitter = new ServiceEventEmitter<QueueLogModel>();
  private baseService = new BaseService<QueueLogModel>(this.emitter, QueueLogModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(queueId: string, query: any) {
    const url = this.getUrl(queueId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(queueId: string, json: Partial<QueueLogModel>) {
    const url = this.getUrl(queueId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(queueId: string, _id: string) {
    const url = this.getUrl(queueId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(queueId: string, query: any) {
    const url = this.getUrl(queueId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(queueId: string, _id: string) {
    const url = this.getUrl(queueId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(queueId: string, _id: string, json: Partial<QueueLogModel>) {
    const url = this.getUrl(queueId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(queueId: string) {
    return `${apiUrl}/queues/${queueId}/logs`;
  }
}

export const queueLogService = new QueueLogService();
