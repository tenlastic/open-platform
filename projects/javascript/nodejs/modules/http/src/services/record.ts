import { apiUrl } from '../api-url';
import { RecordModel } from '../models/record';
import { BaseService, ServiceEventEmitter } from './base';

export class RecordService {
  public emitter = new ServiceEventEmitter<RecordModel>();
  private baseService = new BaseService<RecordModel>(this.emitter, RecordModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(databaseId: string, collectionId: string, query: any) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(databaseId: string, collectionId: string, json: Partial<RecordModel>) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(databaseId: string, collectionId: string, _id: string) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(databaseId: string, collectionId: string, query: any) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(databaseId: string, collectionId: string, _id: string) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(
    databaseId: string,
    collectionId: string,
    _id: string,
    json: Partial<RecordModel>,
  ) {
    const url = this.getUrl(databaseId, collectionId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(databaseId: string, collectionId: string) {
    return `${apiUrl}/databases/${databaseId}/collections/${collectionId}/records`;
  }
}

export const recordService = new RecordService();
