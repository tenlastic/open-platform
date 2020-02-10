import { EventEmitter, Injectable } from '@angular/core';

import { ReleaseJob } from '../../models/release-job';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class ReleaseJobService {
  public basePath: string;
  public emitEvents = true;

  public onCreate = new EventEmitter<ReleaseJob>();
  public onDelete = new EventEmitter<ReleaseJob>();
  public onUpdate = new EventEmitter<ReleaseJob>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.releaseApiBaseUrl;
  }

  public async delete(releaseId: string, _id: string): Promise<ReleaseJob> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${releaseId}/jobs/${_id}`,
      null,
    );

    const record = new ReleaseJob(response.record);

    if (this.emitEvents) {
      this.onDelete.emit(record);
    }

    return record;
  }

  public async find(releaseId: string, parameters: RestParameters): Promise<ReleaseJob[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${releaseId}/jobs`,
      parameters,
    );

    return response.records.map(record => new ReleaseJob(record));
  }
}
