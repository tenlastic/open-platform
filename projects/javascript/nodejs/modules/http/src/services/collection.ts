import { apiUrl } from '../api-url';
import { CollectionModel } from '../models/collection';
import { BaseService, ServiceEventEmitter } from './base';

export class CollectionService {
  public emitter = new ServiceEventEmitter<CollectionModel>();
  private baseService = new BaseService<CollectionModel>(this.emitter, CollectionModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(databaseId: string, query: any) {
    const url = this.getUrl(databaseId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(databaseId: string, json: Partial<CollectionModel>) {
    const url = this.getUrl(databaseId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(databaseId: string, _id: string) {
    const url = this.getUrl(databaseId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(databaseId: string, query: any) {
    const url = this.getUrl(databaseId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(databaseId: string, _id: string) {
    const url = this.getUrl(databaseId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(databaseId: string, _id: string, json: Partial<CollectionModel>) {
    const url = this.getUrl(databaseId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(databaseId: string) {
    return `${apiUrl}/databases/${databaseId}/collections`;
  }
}

export const collectionService = new CollectionService();
