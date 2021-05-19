import { apiUrl } from '../api-url';
import { BuildLogModel } from '../models/build-log';
import { BaseService, ServiceEventEmitter } from './base';

export class BuildLogService {
  public emitter = new ServiceEventEmitter<BuildLogModel>();
  private baseService = new BaseService<BuildLogModel>(this.emitter, BuildLogModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(buildId: string, query: any) {
    const url = this.getUrl(buildId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(buildId: string, json: Partial<BuildLogModel>) {
    const url = this.getUrl(buildId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(buildId: string, _id: string) {
    const url = this.getUrl(buildId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(buildId: string, query: any) {
    const url = this.getUrl(buildId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(buildId: string, _id: string) {
    const url = this.getUrl(buildId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(buildId: string, _id: string, json: Partial<BuildLogModel>) {
    const url = this.getUrl(buildId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(buildId: string) {
    return `${apiUrl}/builds/${buildId}/logs`;
  }
}

export const buildLogService = new BuildLogService();
