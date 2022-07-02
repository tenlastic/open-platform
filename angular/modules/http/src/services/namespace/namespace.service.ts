import { EventEmitter, Injectable } from '@angular/core';

import { Namespace } from '../../models/namespace';
import { NamespaceLog } from '../../models/namespace-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface NamespaceServiceLogsOptions {
  since?: string;
  tail?: number;
}

@Injectable({ providedIn: 'root' })
export class NamespaceService {
  public basePath: string;

  public onCreate = new EventEmitter<Namespace>();
  public onDelete = new EventEmitter<Namespace>();
  public onLogs = new EventEmitter<NamespaceLog[]>();
  public onRead = new EventEmitter<Namespace[]>();
  public onUpdate = new EventEmitter<Namespace>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.namespaceApiBaseUrl;
  }

  public async create(parameters: Partial<Namespace>): Promise<Namespace> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Namespace(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Namespace> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Namespace(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Namespace[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map((record) => new Namespace(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Namespace> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Namespace(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async logs(
    _id: string,
    nodeId: string,
    parameters?: NamespaceServiceLogsOptions,
  ): Promise<NamespaceLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${_id}/logs/${nodeId}`,
      parameters,
    );

    const records = response.records.map(
      (record) => new NamespaceLog({ ...record, databaseId: _id, nodeId }),
    );
    this.onLogs.emit(records);

    return records;
  }

  public async update(parameters: Partial<Namespace>): Promise<Namespace> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Namespace(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
