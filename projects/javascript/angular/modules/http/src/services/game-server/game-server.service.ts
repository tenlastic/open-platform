import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { GameServer } from '../../models/game-server';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface GameServerServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class GameServerService {
  public basePath: string;

  public onCreate = new EventEmitter<GameServer>();
  public onDelete = new EventEmitter<GameServer>();
  public onUpdate = new EventEmitter<GameServer>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameServerApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<GameServer>): Promise<GameServer> {
    const response = await this.apiService.request('post', this.basePath, parameters);
    const record = new GameServer(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<GameServer> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);
    const record = new GameServer(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<GameServer[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new GameServer(record));
  }

  public async findOne(_id: string): Promise<GameServer> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    return new GameServer(response.record);
  }

  public async update(parameters: Partial<GameServer>): Promise<GameServer> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new GameServer(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
