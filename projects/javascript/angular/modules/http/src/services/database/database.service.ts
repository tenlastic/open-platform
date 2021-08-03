import { EventEmitter, Injectable } from '@angular/core';

import { Database } from '../../models/database';
import { DatabaseLog } from '../../models/database-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface DatabaseServiceLogsOptions {
  since?: string;
  tail?: number;
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  public basePath: string;

  public onCreate = new EventEmitter<Database>();
  public onDelete = new EventEmitter<Database>();
  public onLogs = new EventEmitter<DatabaseLog[]>();
  public onRead = new EventEmitter<Database[]>();
  public onUpdate = new EventEmitter<Database>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.databaseApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Database>): Promise<Database> {
    const response = await this.apiService.request('post', `${this.basePath}`, parameters);

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
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Database(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Database> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Database(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async logs(
    _id: string,
    nodeId: string,
    parameters?: DatabaseServiceLogsOptions,
  ): Promise<DatabaseLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${_id}/logs/${nodeId}`,
      parameters,
    );

    const records = response.records.map(
      record => new DatabaseLog({ ...record, databaseId: _id, nodeId }),
    );
    this.onLogs.emit(records);

    return records;
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
