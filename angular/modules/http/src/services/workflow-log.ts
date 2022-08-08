import { WorkflowLogModel } from '../models/workflow-log';
import { WorkflowLogStore } from '../states/workflow-log';
import { ApiService } from './api/api';
import { EnvironmentService } from './environment';

export interface WorkflowLogsQuery {
  since?: string;
  tail?: number;
}

export class WorkflowLogService {
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
    nodeId: string,
    query: WorkflowLogsQuery,
  ) {
    const url = this.getUrl(namespaceId, workflowId);
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${nodeId}`,
    });

    const records = response.data.records.map(
      (record) => new WorkflowLogModel({ ...record, workflowId, nodeId }),
    );
    this.workflowLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, workflowId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/workflows/${workflowId}/logs`;
  }
}
