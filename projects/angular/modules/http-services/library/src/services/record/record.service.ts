import { EventEmitter, Injectable } from '@angular/core';

import { Record } from '../../models/record';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class RecordService {
  public basePath: string;

  public onCreate = new EventEmitter<Record>();
  public onDelete = new EventEmitter<Record>();
  public onUpdate = new EventEmitter<Record>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.databaseApiBaseUrl;
  }

  public async create(
    databaseName: string,
    collectionName: string,
    parameters: Partial<Record>,
  ): Promise<Record> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${databaseName}/collections/${collectionName}/records`,
      parameters,
    );

    const record = new Record(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(databaseName: string, collectionName: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${databaseName}/collections/${collectionName}/records/${_id}`,
    );

    const record = new Record(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(
    databaseName: string,
    collectionName: string,
    parameters: RestParameters,
  ): Promise<Record[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseName}/collections/${collectionName}/records`,
      parameters,
    );

    return response.records.map(record => new Record(record));
  }

  public async findOne(databaseName: string, collectionName: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseName}/collections/${collectionName}/records/${_id}`,
    );

    return new Record(response.record);
  }

  public async update(
    databaseName: string,
    collectionName: string,
    parameters: Partial<Record>,
  ): Promise<Record> {
    const { _id } = parameters;

    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${databaseName}/collections/${collectionName}/records/${_id}`,
      parameters,
    );

    const record = new Record(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
