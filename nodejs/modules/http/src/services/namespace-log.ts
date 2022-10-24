import { NamespaceLogModel } from '../models/namespace-log';
import { NamespaceLogStore } from '../states/namespace-log';
import { ApiService } from './api';
import { EnvironmentService } from './environment';

export interface NamespaceLogsQuery {
  since?: string;
  tail?: number;
}

export class NamespaceLogService {
  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private namespaceLogStore: NamespaceLogStore,
  ) {}

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(
    namespaceId: string,
    pod: string,
    container: string,
    query: NamespaceLogsQuery,
  ) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new NamespaceLogModel({ ...record, container, namespaceId, pod }),
    );
    this.namespaceLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    const { apiUrl } = this.environmentService;
    return `${apiUrl}/namespaces/${namespaceId}/logs`;
  }
}
