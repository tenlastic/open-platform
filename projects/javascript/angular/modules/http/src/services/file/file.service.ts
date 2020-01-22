import { EventEmitter, Injectable } from '@angular/core';

import { File } from '../../models/file';
import { ApiService, RestParameters } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface FileServiceDownloadOptions {
  include?: string[];
}

export interface FileServiceUploadOptions {
  modified?: string[];
  previousReleaseId?: string;
  removed?: string[];
  unmodified?: string[];
  zip?: Blob;
}

@Injectable({ providedIn: 'root' })
export class FileService {
  public basePath: string;

  public onCreate = new EventEmitter<File>();
  public onDelete = new EventEmitter<File>();
  public onUpdate = new EventEmitter<File>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.releaseApiBaseUrl;
  }

  public async create(releaseId: string, platform: string, parameters: Partial<File>) {
    const response = await this.apiService.request(
      'post',
      `${this.basePath}/${releaseId}/platforms/${platform}/files`,
      parameters,
    );

    const record = new File(response.record);
    this.onCreate.emit(record);

    return record;
  }

  public async delete(releaseId: string, platform: string, _id: string): Promise<File> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/${_id}`,
    );

    const record = new File(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public async download(
    releaseId: string,
    platform: string,
    parameters: FileServiceDownloadOptions,
  ) {
    return this.apiService.request(
      'post',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/download`,
      parameters,
      { responseType: 'blob' },
    );
  }

  public async find(
    releaseId: string,
    platform: string,
    parameters: RestParameters,
  ): Promise<File[]> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${releaseId}/platforms/${platform}/files`,
      parameters,
    );

    return response.records.map(record => new File(record));
  }

  public async findOne(releaseId: string, platform: string, _id: string): Promise<File> {
    const response = await this.apiService.request(
      'get',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/${_id}`,
    );

    return new File(response.record);
  }

  public async update(
    releaseId: string,
    platform: string,
    parameters: Partial<File>,
  ): Promise<File> {
    const response = await this.apiService.request(
      'put',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/${parameters._id}`,
      parameters,
    );

    const record = new File(response.record);
    this.onUpdate.emit(record);

    return record;
  }

  public async upload(releaseId: string, platform: string, parameters: FileServiceUploadOptions) {
    const formData = new FormData();

    parameters.modified.forEach(m => formData.append('modified[]', m));
    formData.append('previousReleaseId', parameters.previousReleaseId);
    parameters.removed.forEach(r => formData.append('removed[]', r));
    parameters.unmodified.forEach(u => formData.append('unmodified[]', u));
    formData.append('zip', parameters.zip);

    return this.apiService.request(
      'post',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/upload`,
      formData,
    );
  }
}
