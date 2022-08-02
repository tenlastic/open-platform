import { apiUrl } from '../api-url';
import { RecordModel } from '../models/record';
import { BaseService, ServiceEventEmitter } from './base';

export class RecordService {
  public emitter = new ServiceEventEmitter<RecordModel>();
  private baseService = new BaseService<RecordModel>(this.emitter, RecordModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, collectionId: string, query: any) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(namespaceId: string, collectionId: string, json: Partial<RecordModel>) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, collectionId: string, _id: string) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, collectionId: string, query: any) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(namespaceId: string, collectionId: string, _id: string) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(
    namespaceId: string,
    collectionId: string,
    _id: string,
    json: Partial<RecordModel>,
  ) {
    const url = this.getUrl(namespaceId, collectionId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, collectionId: string) {
    return `${apiUrl}/namespaces/${namespaceId}/collections/${collectionId}/records`;
  }
}

export const recordService = new RecordService();
