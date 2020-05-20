import { EventEmitter, Injectable } from '@angular/core';

import { ReleaseTask } from '../../models/release-task';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class ReleaseTaskService {
  public basePath: string;

  public onCreate = new EventEmitter<ReleaseTask>();
  public onDelete = new EventEmitter<ReleaseTask>();
  public onUpdate = new EventEmitter<ReleaseTask>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.releaseApiBaseUrl;
  }

  public async delete(releaseId: string, _id: string): Promise<ReleaseTask> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${releaseId}/tasks/${_id}`,
      null,
    );

    const record = new ReleaseTask(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(releaseId: string, parameters: RestParameters): Promise<ReleaseTask[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${releaseId}/tasks`,
      parameters,
    );

    return response.records.map(record => new ReleaseTask(record));
  }
}
