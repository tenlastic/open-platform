import { EventEmitter, Injectable } from '@angular/core';

import { Connection } from '../../models/connection';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  public basePath: string;

  public onCreate = new EventEmitter<Connection>();
  public onDelete = new EventEmitter<Connection>();
  public onUpdate = new EventEmitter<Connection>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.connectionApiBaseUrl;
  }

  public async find(parameters: RestParameters): Promise<Connection[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    return response.records.map(record => new Connection(record));
  }

  public async findOne(_id: string): Promise<Connection> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`);

    return new Connection(response.record);
  }
}
