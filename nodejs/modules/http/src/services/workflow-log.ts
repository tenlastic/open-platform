import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { WorkflowLogModel } from '../models/workflow-log';
import { WorkflowLogStore } from '../states/workflow-log';
import { ApiService } from './api';
import { ServiceEvents } from './base';
import { EnvironmentService } from './environment';

export interface WorkflowLogsQuery {
  since?: string;
  tail?: number;
}

export class WorkflowLogService {
  public emitter = new EventEmitter() as TypedEmitter<ServiceEvents<WorkflowLogModel>>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private workflowLogStore: WorkflowLogStore,
  ) {}

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(
    namespaceId: string,
    workflowId: string,
    pod: string,
    container: string,
    query: WorkflowLogsQuery,
  ) {
    const url = this.getUrl(namespaceId, workflowId);
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${pod}/${container}`,
    });

    const records = response.data.records.map(
      (record) => new WorkflowLogModel({ ...record, container, pod, workflowId }),
    );
    this.workflowLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, workflowId: string) {
    const { apiUrl } = this.environmentService;
    return `${apiUrl}/namespaces/${namespaceId}/workflows/${workflowId}/logs`;
  }
}
