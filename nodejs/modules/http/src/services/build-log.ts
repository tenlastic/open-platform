import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { BuildLogModel } from '../models/build-log';
import { ApiService } from './api';
import { BaseServiceRecordsResponse, ServiceEvents } from './base';
import { EnvironmentService } from './environment';

export interface BuildLogsQuery {
  since?: string;
  tail?: number;
}

export class BuildLogService {
  public emitter = new EventEmitter() as TypedEmitter<ServiceEvents<BuildLogModel>>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

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
    const response = await this.apiService.request<BaseServiceRecordsResponse<BuildLogModel>>({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new BuildLogModel({ ...record, container, buildId, pod }),
    );
    this.emitter.emit('find', records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, buildId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/builds/${buildId}/logs`;
  }
}
