import { EventEmitter, Injectable } from '@angular/core';

import { Database } from '../../models/database';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class DatabaseService {
  public basePath: string;

  public onCreate = new EventEmitter<Database>();
  public onDelete = new EventEmitter<Database>();
  public onUpdate = new EventEmitter<Database>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.databaseApiBaseUrl;
  }

  public async create(parameters: Partial<Database>): Promise<Database> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Database(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Database> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Database(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Database[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Database(record));
  }

  public async findOne(name: string): Promise<Database> {
    const response = await this.apiService.request('get', `${this.basePath}/${name}`, null);

    return new Database(response.record);
  }

  public async update(parameters: Partial<Database>): Promise<Database> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Database(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
