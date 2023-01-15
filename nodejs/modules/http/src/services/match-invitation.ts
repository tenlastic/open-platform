import { MatchInvitationModel } from '../models/match-invitation';
import { MatchInvitationStore } from '../states/match-invitation';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class MatchInvitationService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<MatchInvitationModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private matchInvitationStore: MatchInvitationStore,
  ) {
    this.baseService = new BaseService<MatchInvitationModel>(
      this.apiService,
      MatchInvitationModel,
      this.matchInvitationStore,
    );
  }

  /**
   * Accepts the Match Invitation.
   */
  public async accept(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'patch',
      url: `${url}/${_id}/accepted-at`,
    });

    const record = new MatchInvitationModel(response.data.record);
    this.emitter.emit('update', record);
    this.matchInvitationStore.upsertMany([record]);

    return record;
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
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
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return namespaceId
      ? `${this.environmentService.apiUrl}/namespaces/${namespaceId}/match-invitations`
      : `${this.environmentService.apiUrl}/match-invitations`;
  }
}
