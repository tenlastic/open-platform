import { EventEmitter, Injectable } from '@angular/core';

import { ApiService, RestParameters } from '@app/core/http/api/api.service';
import { Database } from '@app/shared/models';
import { environment } from '@env/environment';

@Injectable()
export class DatabaseService {
  public basePath = environment.databaseApiBaseUrl;

  public onCreate = new EventEmitter<Database>();
  public onDelete = new EventEmitter<Database>();
  public onUpdate = new EventEmitter<Database>();

  constructor(private apiService: ApiService) {}

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
