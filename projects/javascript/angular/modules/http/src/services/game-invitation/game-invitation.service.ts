import { EventEmitter, Injectable } from '@angular/core';

import { GameInvitation } from '../../models/game-invitation';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class GameInvitationService {
  public basePath: string;

  public onCreate = new EventEmitter<GameInvitation>();
  public onDelete = new EventEmitter<GameInvitation>();
  public onRead = new EventEmitter<GameInvitation[]>();
  public onUpdate = new EventEmitter<GameInvitation>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.gameInvitationApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<GameInvitation>): Promise<GameInvitation> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new GameInvitation(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<GameInvitation> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new GameInvitation(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<GameInvitation[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new GameInvitation(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<GameInvitation> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new GameInvitation(response.record);
    this.onRead.emit([record]);

    return record;
  }
}
