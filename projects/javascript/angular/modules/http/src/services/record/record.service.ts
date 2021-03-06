import { EventEmitter, Injectable } from '@angular/core';

import { Record } from '../../models/record';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class RecordService {
  public basePath: string;

  public onCreate = new EventEmitter<Record>();
  public onDelete = new EventEmitter<Record>();
  public onRead = new EventEmitter<Record[]>();
  public onUpdate = new EventEmitter<Record>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.databaseApiBaseUrl;
  }

  public async create(
    databaseId: string,
    collectionId: string,
    parameters: Partial<Record>,
  ): Promise<Record> {
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

    const records = response.records.map(record => new Record(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(databaseId: string, collectionId: string, _id: string): Promise<Record> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${databaseId}/collections/${collectionId}/records/${_id}`,
    );

    const record = new Record(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(
    databaseId: string,
    collectionId: string,
    parameters: Partial<Record>,
  ): Promise<Record> {
    const { _id } = parameters;

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
