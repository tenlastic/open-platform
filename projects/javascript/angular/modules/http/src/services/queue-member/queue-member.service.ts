import { EventEmitter, Injectable } from '@angular/core';

import { QueueMember } from '../../models/queue-member';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class QueueMemberService {
  public basePath: string;

  public onCreate = new EventEmitter<QueueMember>();
  public onDelete = new EventEmitter<QueueMember>();
  public onRead = new EventEmitter<QueueMember[]>();
  public onUpdate = new EventEmitter<QueueMember>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.queueMemberApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<QueueMember>): Promise<QueueMember> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

    const record = new QueueMember(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<QueueMember> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new QueueMember(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<QueueMember[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new QueueMember(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<QueueMember> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new QueueMember(response.record);
    this.onRead.emit([record]);

    return record;
  }
}
