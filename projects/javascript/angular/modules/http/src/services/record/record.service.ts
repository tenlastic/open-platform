import { EventEmitter, Injectable } from '@angular/core';

import { Record } from '../../models/record';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class RecordService {
  public basePath: string;

  public onCreate = new EventEmitter<Record>();
  public onDelete = new EventEmitter<Record>();
  public onUpdate = new EventEmitter<Record>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.collectionApiBaseUrl;
  }

  public async create(collectionId: string, parameters: Partial<Record>): Promise<Record> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${collectionId}/records`,
      parameters,
    );

    const record = new Record(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(collectionId: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${collectionId}/records/${_id}`,
    );

    const record = new Record(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(collectionId: string, parameters: RestParameters): Promise<Record[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${collectionId}/records`,
      parameters,
    );

    return response.records.map(record => new Record(record));
  }

  public async findOne(collectionId: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${collectionId}/records/${_id}`,
    );

    return new Record(response.record);
  }

  public async update(collectionId: string, parameters: Partial<Record>): Promise<Record> {
    const { _id } = parameters;

    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${collectionId}/records/${_id}`,
      parameters,
    );

    const record = new Record(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
