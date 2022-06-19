import { EventEmitter, Injectable } from '@angular/core';

import { GroupInvitation } from '../../models/group-invitation';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class GroupInvitationService {
  public basePath: string;

  public onCreate = new EventEmitter<GroupInvitation>();
  public onDelete = new EventEmitter<GroupInvitation>();
  public onRead = new EventEmitter<GroupInvitation[]>();
  public onUpdate = new EventEmitter<GroupInvitation>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.groupInvitationApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<GroupInvitation>): Promise<GroupInvitation> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new GroupInvitation(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<GroupInvitation> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new GroupInvitation(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<GroupInvitation[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new GroupInvitation(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<GroupInvitation> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new GroupInvitation(response.record);
    this.onRead.emit([record]);

    return record;
  }
}
