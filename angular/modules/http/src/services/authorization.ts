import { AuthorizationModel } from '../models/authorization';
import { AuthorizationStore } from '../states/authorization';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class AuthorizationService {
  public emitter = new ServiceEventEmitter<AuthorizationModel>();

  private baseService: BaseService<AuthorizationModel>;

  constructor(
    private apiService: ApiService,
    private authorizationStore: AuthorizationStore,
    private environmentService: EnvironmentService,
  ) {
    this.baseService = new BaseService<AuthorizationModel>(
      this.apiService,
      this.emitter,
      AuthorizationModel,
      this.authorizationStore,
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
  public async create(json: Partial<AuthorizationModel>) {
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
   * Returns Authorizations associated with the User.
   */
  public async findUserAuthorizations(namespaceId: string, userId: string) {
    let where = {};

    if (namespaceId) {
      where = {
        $or: [
          { namespaceId, userId },
          { namespaceId: { $exists: false }, userId },
          { apiKey: { $exists: false }, namespaceId, userId: { $exists: false } },
        ],
      };
    } else {
      where = { userId };
    }

    return this.find({ where });
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<AuthorizationModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/authorizations`;
  }
}
