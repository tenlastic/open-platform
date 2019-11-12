import { EventEmitter, Injectable } from '@angular/core';

import { ApiService, RestParameters } from '@app/core/http/api/api.service';
import { Collection } from '@app/shared/models';
import { environment } from '@env/environment';

@Injectable()
export class CollectionService {
  public basePath = environment.databaseApiBaseUrl;

  public onCreate = new EventEmitter<Collection>();
  public onDelete = new EventEmitter<Collection>();
  public onUpdate = new EventEmitter<Collection>();

  constructor(private apiService: ApiService) {}

  public async create(databaseName: string, parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${databaseName}/collections`,
      parameters,
    );

    const record = new Collection(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(databaseName: string, name: string): Promise<Collection> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${databaseName}/collections/${name}`,
    );

    const record = new Collection(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(databaseName: string, parameters: RestParameters): Promise<Collection[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseName}/collections`,
      parameters,
    );

    return response.records.map(record => new Collection(record));
  }

  public async findOne(databaseName: string, name: string): Promise<Collection> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseName}/collections/${name}`,
    );

    return new Collection(response.record);
  }

  public async update(databaseName: string, parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${databaseName}/collections/${parameters.name}`,
      parameters,
    );

    const record = new Collection(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
