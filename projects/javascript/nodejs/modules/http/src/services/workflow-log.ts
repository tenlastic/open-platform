import { apiUrl } from '../api-url';
import { WorkflowLogModel } from '../models/workflow-log';
import { BaseService, ServiceEventEmitter } from './base';

export class WorkflowLogService {
  public emitter = new ServiceEventEmitter<WorkflowLogModel>();
  private baseService = new BaseService<WorkflowLogModel>(this.emitter, WorkflowLogModel);

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(workflowId: string, nodeId: string, query: any) {
    const url = this.getUrl(workflowId);
    return this.baseService.find(query, `${url}/${nodeId}`);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(workflowId: string) {
    return `${apiUrl}/workflows/${workflowId}/logs`;
  }
}

export const workflowLogService = new WorkflowLogService();
