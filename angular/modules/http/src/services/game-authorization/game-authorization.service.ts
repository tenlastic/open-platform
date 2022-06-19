import { EventEmitter, Injectable } from '@angular/core';

import { GameAuthorization } from '../../models/game-authorization';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface GameAuthorizationServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class GameAuthorizationService {
  public basePath: string;

  public onCreate = new EventEmitter<GameAuthorization>();
  public onDelete = new EventEmitter<GameAuthorization>();
  public onRead = new EventEmitter<GameAuthorization[]>();
  public onUpdate = new EventEmitter<GameAuthorization>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameAuthorizationApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<GameAuthorization>): Promise<GameAuthorization> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new GameAuthorization(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<GameAuthorization> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new GameAuthorization(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<GameAuthorization[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new GameAuthorization(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<GameAuthorization> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new GameAuthorization(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<GameAuthorization>): Promise<GameAuthorization> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new GameAuthorization(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
