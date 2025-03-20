import { GroupModel } from '../models/group';
import { GroupStore } from '../states/group';
import {
  WebSocket,
  WebSocketMethod,
  WebSocketRequest,
  WebSocketResponse,
  WebSocketResponseError,
} from '../web-socket';
import { ApiService } from './api';
import { BaseService, BaseServiceFindQuery } from './base';
import { EnvironmentService } from './environment';
import { WebSocketService } from './web-socket';

interface GroupResponse extends WebSocketResponse {
  body: {
    errors?: WebSocketResponseError[];
    record: Partial<GroupModel>;
  };
}

export class GroupService {
  public get emitter() {
    return this.baseService.emitter;
  }

  private baseService: BaseService<GroupModel>;

  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private groupStore: GroupStore,
    private webSocketService: WebSocketService,
  ) {
    this.baseService = new BaseService<GroupModel>(this.apiService, GroupModel, this.groupStore);
  }

  /**
   * Adds a Group Member to a Group.
   */
  public async addMember(_id: string, webSocket: WebSocket): Promise<GroupModel> {
    const request: WebSocketRequest = {
      method: WebSocketMethod.Post,
      path: `/groups/${_id}/members`,
    };
    const response = await this.webSocketService.request<GroupResponse>(request, webSocket);

    const record = new GroupModel(response.body.record);
    this.emitter.emit('update', record);
    this.groupStore.upsertMany([record]);

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
   * Creates a Record.
   */
  public async create(webSocket: WebSocket) {
    const request: WebSocketRequest = {
      method: WebSocketMethod.Post,
      path: '/groups',
    };
    const response = await this.webSocketService.request<GroupResponse>(request, webSocket);

    const record = new GroupModel(response.body.record);
    this.emitter.emit('create', record);
    this.groupStore.upsertMany([record]);

    return record;
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
   * Removes a Group Member from a Group.
   */
  public async removeMember(
    namespaceId: string,
    groupId: string,
    _id: string,
  ): Promise<GroupModel> {
    const url = this.getUrl(namespaceId);
    const response = await this.apiService.request({
      method: 'delete',
      url: `${url}/${groupId}/members/${_id}`,
    });

    const record = new GroupModel(response.data.record);
    this.emitter.emit('update', record);
    this.groupStore.upsert(groupId, record);

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
