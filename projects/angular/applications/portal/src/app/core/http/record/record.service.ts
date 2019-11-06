import { EventEmitter, Injectable } from '@angular/core';

import { ApiService, RestParameters } from '@app/core/http/api/api.service';
import { Record } from '@app/shared/models';
import { environment } from '@env/environment';

@Injectable()
export class RecordService {
  public basePath = environment.databaseApiBaseUrl;

  public onCreate = new EventEmitter<Record>();
  public onDelete = new EventEmitter<Record>();
  public onUpdate = new EventEmitter<Record>();

  constructor(private apiService: ApiService) {}

  public async create(parameters: Partial<Record>): Promise<Record> {
    const { collectionId, databaseId } = parameters;

    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records`,
      parameters,
    );

    const record = new Record(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(databaseId: string, collectionId: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records/${_id}`,
    );

    const record = new Record(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(
    databaseId: string,
    collectionId: string,
    parameters: RestParameters,
  ): Promise<Record[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records`,
      parameters,
    );

    return response.records.map(record => new Record(record));
  }

  public async findOne(databaseId: string, collectionId: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records/${_id}`,
    );

    return new Record(response.record);
  }

  public async update(parameters: Partial<Record>): Promise<Record> {
    const { _id, collectionId, databaseId } = parameters;

    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records/${_id}`,
      parameters,
    );

    const record = new Record(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
