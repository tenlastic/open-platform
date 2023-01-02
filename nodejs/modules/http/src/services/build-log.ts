import { BuildLogModel } from '../models/build-log';
import { BuildLogStore } from '../states/build-log';
import { ApiService } from './api';
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
  public async find(
    namespaceId: string,
    buildId: string,
    pod: string,
    container: string,
    query: BuildLogsQuery,
  ) {
    const url = this.getUrl(namespaceId, buildId);
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new BuildLogModel({ ...record, container, buildId, pod }),
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
