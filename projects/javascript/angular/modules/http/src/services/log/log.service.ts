import { EventEmitter, Injectable } from '@angular/core';

import { Log } from '../../models/log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class LogService {
  public basePath: string;

  public onCreate = new EventEmitter<Log>();
  public onDelete = new EventEmitter<Log>();
  public onRead = new EventEmitter<Log[]>();
  public onUpdate = new EventEmitter<Log>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.logApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Log>): Promise<Log> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Log(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Log[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new Log(record));
    this.onRead.emit(records);

    return records;
  }
}
