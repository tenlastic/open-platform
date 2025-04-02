import { GroupModel } from '../models/group';
import { GroupStore } from '../states/group';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';

export class GroupService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<GroupModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private groupStore: GroupStore,
  ) {
    this.baseService = new BaseService<GroupModel>(this.apiService, GroupModel, this.groupStore);
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
  public async create(namespaceId: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.create(null, url);
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
   * Joins a Group.
   */
  public async join(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'post',
      url: `${url}/${_id}/user-ids`,
    });

    const record = new GroupModel(response.data.record);
    this.emitter.emit('update', record);
    this.groupStore.upsertMany([record]);

    return record;
  }

  /**
   * Leaves a Group.
   */
  public async leave(namespaceId: string, groupId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'delete',
      url: `${url}/${groupId}/user-ids/${_id}`,
    });

    const record = new GroupModel(response.data.record);
    this.emitter.emit('update', record);
    this.groupStore.upsertMany([record]);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<GroupModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/groups`;
  }
}
