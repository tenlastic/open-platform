import { EventEmitter, Injectable } from '@angular/core';

import { ApiService, RestParameters } from '@app/core/http/api/api.service';
import { User } from '@app/shared/models';
import { environment } from '@env/environment';

@Injectable()
export class UserService {
  public basePath = environment.userApiBaseUrl;

  public onCreate = new EventEmitter<User>();
  public onDelete = new EventEmitter<User>();
  public onUpdate = new EventEmitter<User>();

  constructor(private apiService: ApiService) {}

  public async create(parameters: Partial<User>): Promise<User> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new User(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<User> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new User(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<User[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new User(record));
  }

  public async findOne(_id: string): Promise<User> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    return new User(response.record);
  }

  public async update(parameters: Partial<User>): Promise<User> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new User(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
