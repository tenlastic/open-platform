import { EventEmitter, Injectable } from '@angular/core';

import { GameServerLog } from '../../models/game-server-log';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class GameServerLogService {
  public basePath: string;

  public onCreate = new EventEmitter<GameServerLog>();
  public onDelete = new EventEmitter<GameServerLog>();
  public onRead = new EventEmitter<GameServerLog[]>();
  public onUpdate = new EventEmitter<GameServerLog>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameServerApiBaseUrl;
  }

  public async count(gameServerId: string, parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${gameServerId}/logs/count`,
      parameters,
    );

    return response.count;
  }

  public async create(
    gameServerId: string,
    parameters: Partial<GameServerLog>,
  ): Promise<GameServerLog> {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${gameServerId}/logs`,
      parameters,
    );

    const record = new GameServerLog(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async find(gameServerId: string, parameters: RestParameters): Promise<GameServerLog[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${gameServerId}/logs`,
      parameters,
    );

    const records = response.records.map(record => new GameServerLog(record));
    this.onRead.emit(records);

    return records;
  }
}
