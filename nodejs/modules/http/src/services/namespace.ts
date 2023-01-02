import { NamespaceModel } from '../models/namespace';
import { NamespaceStore } from '../states/namespace';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class NamespaceService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<NamespaceModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private namespaceStore: NamespaceStore,
  ) {
    this.baseService = new BaseService<NamespaceModel>(
      this.apiService,
      NamespaceModel,
      this.namespaceStore,
    );
  }

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
  public async create(json: Partial<NamespaceModel>) {
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
  public async find(query: BaseServiceFindQuery) {
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
  public async update(_id: string, json: Partial<NamespaceModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/namespaces`;
  }
}
