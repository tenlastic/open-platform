import { WorkflowModel } from '../models/workflow';
import { WorkflowStore } from '../states/workflow';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class WorkflowService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<WorkflowModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private workflowStore: WorkflowStore,
  ) {
    this.baseService = new BaseService<WorkflowModel>(
      this.apiService,
      WorkflowModel,
      this.workflowStore,
    );
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(namespaceId: string, json: Partial<WorkflowModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.create(json, url);
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, query: BaseServiceFindQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<WorkflowModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/workflows`;
  }
}
