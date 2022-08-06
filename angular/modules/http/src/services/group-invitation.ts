import { GroupInvitationModel } from '../models/group-invitation';
import { GroupInvitationStore } from '../states/group-invitation';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class GroupInvitationService {
  public emitter = new ServiceEventEmitter<GroupInvitationModel>();

  private baseService: BaseService<GroupInvitationModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private groupInvitationStore: GroupInvitationStore,
  ) {
    this.baseService = new BaseService<GroupInvitationModel>(
      this.apiService,
      this.emitter,
      GroupInvitationModel,
      this.groupInvitationStore,
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
  public async create(json: Partial<GroupInvitationModel>) {
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
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/group-invitations`;
  }
}
