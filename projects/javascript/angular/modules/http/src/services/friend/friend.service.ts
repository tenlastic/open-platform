import { EventEmitter, Injectable } from '@angular/core';

import { Friend } from '../../models/friend';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class FriendService {
  public basePath: string;

  public onCreate = new EventEmitter<Friend>();
  public onDelete = new EventEmitter<Friend>();
  public onUpdate = new EventEmitter<Friend>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.friendApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Friend>): Promise<Friend> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Friend(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Friend> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Friend(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Friend[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Friend(record));
  }
}
