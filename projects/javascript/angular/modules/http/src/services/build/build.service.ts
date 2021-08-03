import { HttpEventType } from '@angular/common/http';
import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Build } from '../../models/build';
import { BuildLog } from '../../models/build-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface BuildServiceLogsOptions {
  since?: string;
  tail?: number;
}

@Injectable({ providedIn: 'root' })
export class BuildService {
  public basePath: string;

  public onCreate = new EventEmitter<Build>();
  public onDelete = new EventEmitter<Build>();
  public onLogs = new EventEmitter<BuildLog[]>();
  public onRead = new EventEmitter<Build[]>();
  public onUpdate = new EventEmitter<Build>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.buildApiBaseUrl;
  }

  public create(parameters: Partial<Build>, zip: Blob) {
    const formData = new FormData();

    formData.append('build', JSON.stringify(parameters));
    formData.append('zip', zip);

    const observable = this.apiService.request('post', this.basePath, formData, {
      observe: 'events',
      reportProgress: true,
    }) as Observable<any>;
    observable.pipe(
      map(event => {
        if (event.type === HttpEventType.Response) {
          this.onCreate.emit(event.body.record);
        }

        return event;
      }),
    );

    return observable;
  }

  public async delete(_id: string): Promise<Build> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Build(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public download(_id: string) {
    return this.apiService.request('get', `${this.basePath}/${_id}`, null, {
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    }) as Observable<any>;
  }

  public async find(parameters: RestParameters): Promise<Build[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new Build(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Build> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Build(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async logs(
    _id: string,
    nodeId: string,
    parameters?: BuildServiceLogsOptions,
  ): Promise<BuildLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${_id}/logs/${nodeId}`,
      parameters,
    );

    const records = response.records.map(
      record => new BuildLog({ ...record, buildId: _id, nodeId }),
    );
    this.onLogs.emit(records);

    return records;
  }

  public async update(parameters: Partial<Build>): Promise<Build> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Build(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
