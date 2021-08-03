import { apiUrl } from '../api-url';
import { BuildLogModel } from '../models/build-log';
import { BaseService, ServiceEventEmitter } from './base';

export class BuildLogService {
  public emitter = new ServiceEventEmitter<BuildLogModel>();
  private baseService = new BaseService<BuildLogModel>(this.emitter, BuildLogModel);

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(buildId: string, nodeId: string, query: any) {
    const url = this.getUrl(buildId);
    return this.baseService.find(query, `${url}/${nodeId}`);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(buildId: string) {
    return `${apiUrl}/builds/${buildId}/logs`;
  }
}

export const buildLogService = new BuildLogService();
