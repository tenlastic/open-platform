import { apiUrl } from '../api-url';
import { WorkflowLogModel } from '../models/workflow-log';
import { BaseService, ServiceEventEmitter } from './base';

export class WorkflowLogService {
  public emitter = new ServiceEventEmitter<WorkflowLogModel>();
  private baseService = new BaseService<WorkflowLogModel>(this.emitter, WorkflowLogModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(workflowId: string, query: any) {
    const url = this.getUrl(workflowId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(workflowId: string, json: Partial<WorkflowLogModel>) {
    const url = this.getUrl(workflowId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(workflowId: string, _id: string) {
    const url = this.getUrl(workflowId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(workflowId: string, query: any) {
    const url = this.getUrl(workflowId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(workflowId: string, _id: string) {
    const url = this.getUrl(workflowId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(workflowId: string, _id: string, json: Partial<WorkflowLogModel>) {
    const url = this.getUrl(workflowId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(workflowId: string) {
    return `${apiUrl}/workflows/${workflowId}/logs`;
  }
}

export const workflowLogService = new WorkflowLogService();
