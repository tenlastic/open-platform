import { EventEmitter, Injectable } from '@angular/core';

import { Group } from '../../models/group';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class GroupService {
  public basePath: string;
  public emitEvents = true;

  public onCreate = new EventEmitter<Group>();
  public onDelete = new EventEmitter<Group>();
  public onRead = new EventEmitter<Group[]>();
  public onUpdate = new EventEmitter<Group>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.groupApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Group>): Promise<Group> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Group(response.record);

    if (this.emitEvents) {
      this.onCreate.emit(record);
    }

    return record;
  }

  public async delete(_id: string): Promise<Group> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Group(response.record);

    if (this.emitEvents) {
      this.onDelete.emit(record);
    }

    return record;
  }

  public async find(parameters: RestParameters): Promise<Group[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new Group(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Group> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Group(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async join(_id: string): Promise<Group> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${_id}/user-ids`,
      null,
    );

    const record = new Group(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public async leave(_id: string): Promise<Group> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${_id}/user-ids`,
      null,
    );

    const record = new Group(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public async update(parameters: Partial<Group>): Promise<Group> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Group(response.record);

    if (this.emitEvents) {
      this.onUpdate.emit(record);
    }

    return record;
  }
}
