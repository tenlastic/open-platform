import { BuildLogModel } from '../models/build-log';
import { BuildLogStore } from '../states/build-log';
import { ApiService } from './api/api';
import { EnvironmentService } from './environment';

export interface BuildLogsQuery {
  since?: string;
  tail?: number;
}

export class BuildLogService {
  constructor(
    private apiService: ApiService,
    private buildLogStore: BuildLogStore,
    private environmentService: EnvironmentService,
  ) {}

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, buildId: string, nodeId: string, query: BuildLogsQuery) {
    const url = this.getUrl(namespaceId, buildId);
    const response = await this.apiService.observable('get', `${url}/${nodeId}`, query);

    const records = response.records.map(
      (record) => new BuildLogModel({ ...record, buildId, nodeId }),
    );
    this.buildLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, buildId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/builds/${buildId}/logs`;
  }
}
