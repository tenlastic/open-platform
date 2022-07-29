import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Storefront } from '../../models/storefront';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface StorefrontServiceUploadOptions {
  background?: Blob;
  icon?: Blob;
}

@Injectable({ providedIn: 'root' })
export class StorefrontService {
  public basePath: string;

  public onCreate = new EventEmitter<Storefront>();
  public onDelete = new EventEmitter<Storefront>();
  public onRead = new EventEmitter<Storefront[]>();
  public onUpdate = new EventEmitter<Storefront>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.storefrontApiBaseUrl;
  }

  public async count(parameters: RestParameters): Promise<number> {
    const response = await this.apiService.request('get', `${this.basePath}/count`, parameters);

    return response.count;
  }

  public async create(parameters: Partial<Storefront>): Promise<Storefront> {
    const response = await this.apiService.request('post', this.basePath, parameters);

    const record = new Storefront(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(_id: string): Promise<Storefront> {
    const response = await this.apiService.request('delete', `${this.basePath}/${_id}`, null);

    const record = new Storefront(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async find(parameters: RestParameters): Promise<Storefront[]> {
    const response = await this.apiService.request('get', this.basePath, parameters);

    const records = response.records.map((record) => new Storefront(record));
    this.onRead.emit(records);

    return records;
  }

  public async findOne(_id: string): Promise<Storefront> {
    const response = await this.apiService.request('get', `${this.basePath}/${_id}`, null);

    const record = new Storefront(response.record);
    this.onRead.emit([record]);

    return record;
  }

  public async update(parameters: Partial<Storefront>): Promise<Storefront> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${parameters._id}`,
      parameters,
    );

    const record = new Storefront(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public upload(_id: string, key: string, blobs: Blob[]) {
    const formData = new FormData();

    for (const blob of blobs) {
      formData.append(key, blob);
    }

    return this.apiService.request('post', `${this.basePath}/${_id}/${key}`, formData, {
      observe: 'events',
      reportProgress: true,
    }) as Observable<any>;
  }
}
