import { GroupModel } from '../models/group';
import { GroupStore } from '../states/group';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class GroupService {
  public emitter = new ServiceEventEmitter<GroupModel>();

  private baseService: BaseService<GroupModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private groupStore: GroupStore,
  ) {
    this.baseService = new BaseService<GroupModel>(
      this.apiService,
      this.emitter,
      GroupModel,
      this.groupStore,
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
  public async create(json: Partial<GroupModel>) {
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
   * Joins a Group.
   */
  public async join(_id: string): Promise<GroupModel> {
    const url = this.getUrl();
    const response = await this.apiService.observable('post', `${url}/${_id}/user-ids`);

    const record = new GroupModel(response.record);
    this.emitter.emit('update', record);
    this.groupStore.upsert(_id, record);

    return record;
  }

  /**
   * Kicks a User from a Group.
   */
  public async kick(_id: string, userId: string): Promise<GroupModel> {
    const url = this.getUrl();
    const response = await this.apiService.observable(
      'delete',
      `${url}/${_id}/user-ids/${userId}`,
      null,
    );

    const record = new GroupModel(response.record);
    this.emitter.emit('update', record);
    this.groupStore.upsert(_id, record);

    return record;
  }

  /**
   * Leaves a Group.
   */
  public async leave(_id: string): Promise<GroupModel> {
    const url = this.getUrl();
    const response = await this.apiService.observable('delete', `${url}/${_id}/user-ids`, null);

    const record = new GroupModel(response.record);
    this.emitter.emit('update', record);
    this.groupStore.upsert(_id, record);

    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<GroupModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/groups`;
  }
}
