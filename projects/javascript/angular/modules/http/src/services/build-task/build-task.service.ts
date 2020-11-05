import { EventEmitter, Injectable } from '@angular/core';

import { BuildTask } from '../../models/build-task';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class BuildTaskService {
  public basePath: string;

  public onCreate = new EventEmitter<BuildTask>();
  public onDelete = new EventEmitter<BuildTask>();
  public onUpdate = new EventEmitter<BuildTask>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.buildApiBaseUrl;
  }

  public async delete(buildId: string, _id: string): Promise<BuildTask> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${buildId}/tasks/${_id}`,
      null,
    );

    const record = new BuildTask(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(buildId: string, parameters: RestParameters): Promise<BuildTask[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${buildId}/tasks`,
      parameters,
    );

    return response.records.map(record => new BuildTask(record));
  }
}
