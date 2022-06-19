import { apiUrl } from '../api-url';
import { WorkflowModel } from '../models/workflow';
import { BaseService, ServiceEventEmitter } from './base';

export class WorkflowService {
  public emitter = new ServiceEventEmitter<WorkflowModel>();
  private baseService = new BaseService<WorkflowModel>(this.emitter, WorkflowModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any) {
    const url = this.getUrl();
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(json: Partial<WorkflowModel>) {
    const url = this.getUrl();
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string) {
    const url = this.getUrl();
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any) {
    const url = this.getUrl();
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string) {
    const url = this.getUrl();
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<WorkflowModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${apiUrl}/workflows`;
  }
}

export const workflowService = new WorkflowService();
