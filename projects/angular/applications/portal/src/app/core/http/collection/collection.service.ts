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

  public async create(parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${parameters.databaseId}/collections`,
      parameters,
    );

    const record = new Collection(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(databaseId: string, _id: string): Promise<Collection> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${databaseId}/collections/${_id}`,
    );

    const record = new Collection(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(databaseId: string, parameters: RestParameters): Promise<Collection[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections`,
      parameters,
    );

    return response.records.map(record => new Collection(record));
  }

  public async findOne(databaseId: string, _id: string): Promise<Collection> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections/${_id}`,
    );

    return new Collection(response.record);
  }

  public async update(parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters.databaseId}/collections/${parameters._id}`,
      parameters,
    );

    const record = new Collection(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
