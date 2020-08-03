import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Game } from '../../models/game';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface GameServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class GameService {
  public basePath: string;

  public onCreate = new EventEmitter<Game>();
  public onDelete = new EventEmitter<Game>();
  public onRead = new EventEmitter<Game[]>();
  public onUpdate = new EventEmitter<Game>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Game>): Promise<Game> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Game(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Game> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Game(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Game[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new Game(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Game> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Game(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Game>): Promise<Game> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Game(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public upload(_id: string, parameters: GameServiceUploadOptions) {
    const formData = new FormData();

    Object.entries(parameters).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.apiService.request('post', `${this.basePath}/${_id}/upload`, formData, {
      observe: 'events',
      reportProgress: true,
    }) as Observable<any>;
  }
}
