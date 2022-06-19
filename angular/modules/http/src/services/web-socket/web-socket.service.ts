import { EventEmitter, Injectable } from '@angular/core';

import { WebSocket } from '../../models/web-socket';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  public basePath: string;

  public onCreate = new EventEmitter<WebSocket>();
  public onDelete = new EventEmitter<WebSocket>();
  public onRead = new EventEmitter<WebSocket[]>();
  public onUpdate = new EventEmitter<WebSocket>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.webSocketApiBaseUrl;
  }

  public async find(parameters: RestParameters): Promise<WebSocket[]> {
    const response = await this.apiService.request('get', `${this.basePath}`, parameters);

    const records = response.records.map(record => new WebSocket(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<WebSocket> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`);

    const record = new WebSocket(response.record);
    this.onRead.emit([record]);

    return record;
  }
}
