import { apiUrl } from '../api-url';
import { DatabaseLogModel } from '../models/database-log';
import { BaseService, ServiceEventEmitter } from './base';

export class DatabaseLogService {
  public emitter = new ServiceEventEmitter<DatabaseLogModel>();
  private baseService = new BaseService<DatabaseLogModel>(this.emitter, DatabaseLogModel);

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(databaseId: string, nodeId: string, query: any) {
    const url = this.getUrl(databaseId);
    return this.baseService.find(query, `${url}/${nodeId}`);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(databaseId: string) {
    return `${apiUrl}/databases/${databaseId}/logs`;
  }
}

export const databaseLogService = new DatabaseLogService();
