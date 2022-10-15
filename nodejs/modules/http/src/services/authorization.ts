import { AuthorizationModel } from '../models/authorization';
import { AuthorizationStore } from '../states/authorization';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class AuthorizationService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<AuthorizationModel>;

  constructor(
    private apiService: ApiService,
    private authorizationStore: AuthorizationStore,
    private environmentService: EnvironmentService,
  ) {
    this.baseService = new BaseService<AuthorizationModel>(
      this.apiService,
      AuthorizationModel,
      this.authorizationStore,
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
  public async create(namespaceId: string, json: Partial<AuthorizationModel>) {
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

    return this.find(null, { where });
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<AuthorizationModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/authorizations`
      : `${this.environmentService.apiUrl}/authorizations`;
  }
}
