import { EventEmitter, Injectable } from '@angular/core';

import { Collection } from '../../models/collection';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  public basePath: string;

  public onCreate = new EventEmitter<Collection>();
  public onDelete = new EventEmitter<Collection>();
  public onRead = new EventEmitter<Collection[]>();
  public onUpdate = new EventEmitter<Collection>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.databaseApiBaseUrl;
  }

  public async create(databaseId: string, parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${databaseId}/collections`,
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

    const records = response.records.map(record => new Collection(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(databaseId: string, _id: string): Promise<Collection> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections/${_id}`,
    );

    const record = new Collection(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(databaseId: string, parameters: Partial<Collection>): Promise<Collection> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${databaseId}/collections/${parameters._id}`,
      parameters,
    );

    const record = new Collection(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
