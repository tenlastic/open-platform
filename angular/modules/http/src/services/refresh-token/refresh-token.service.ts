import { EventEmitter, Injectable } from '@angular/core';

import { RefreshToken } from '../../models/refresh-token';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable({ providedIn: 'root' })
export class RefreshTokenService {
  public basePath: string;

  public onCreate = new EventEmitter<RefreshToken>();
  public onDelete = new EventEmitter<RefreshToken>();
  public onRead = new EventEmitter<RefreshToken[]>();
  public onUpdate = new EventEmitter<RefreshToken>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.refreshTokenApiBaseUrl;
  }

  public async create(
    parameters: Partial<RefreshToken>,
  ): Promise<{ record: RefreshToken; refreshToken: string }> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new RefreshToken(response.record);
    this.onCreate.emit(record);

    return { record, refreshToken: response.refreshToken };
  }

  public async delete(_id: string): Promise<RefreshToken> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new RefreshToken(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<RefreshToken[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map(record => new RefreshToken(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<RefreshToken> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new RefreshToken(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<RefreshToken>): Promise<RefreshToken> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new RefreshToken(response.record);
    this.onUpdate.emit(record);

    return record;
  }
}
