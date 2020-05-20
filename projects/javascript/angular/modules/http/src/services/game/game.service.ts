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

  public async delete(slug: string): Promise<Game> {
    const response = await this.apiService.request('delete', `${this.basePath}/${slug}`, null);

    const record = new Game(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Game[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    return response.records.map(record => new Game(record));
  }

  public async findOne(slug: string): Promise<Game> {
    const response = await this.apiService.request('get', `${this.basePath}/${slug}`, null);

    return new Game(response.record);
  }

  public async update(parameters: Partial<Game>): Promise<Game> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters.slug}`,
      parameters,
    );

    const record = new Game(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public upload(slug: string, parameters: GameServiceUploadOptions) {
    const formData = new FormData();

    Object.entries(parameters).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.apiService.request('post', `${this.basePath}/${slug}/upload`, formData, {
      observe: 'events',
      reportProgress: true,
    }) as Observable<any>;
  }
}
