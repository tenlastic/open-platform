import { EventEmitter, Injectable } from '@angular/core';

import { BuildLog } from '../../models/build-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class BuildLogService {
  public basePath: string;

  public onCreate = new EventEmitter<BuildLog>();
  public onDelete = new EventEmitter<BuildLog>();
  public onRead = new EventEmitter<BuildLog[]>();
  public onUpdate = new EventEmitter<BuildLog>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.buildApiBaseUrl;
  }

  public async count(buildId: string, parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${buildId}/logs/count`,
      parameters,
    );

    return response.count;
  }

  public async create(buildId: string, parameters: Partial<BuildLog>): Promise<BuildLog> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${buildId}/logs`,
      parameters,
    );

    const record = new BuildLog(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async find(buildId: string, parameters: RestParameters): Promise<BuildLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${buildId}/logs`,
      parameters,
    );

    const records = response.records.map(record => new BuildLog(record));
    this.onRead.emit(records);

    return records;
  }
}
