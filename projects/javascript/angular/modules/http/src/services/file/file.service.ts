import { EventEmitter, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  public async delete(releaseId: string, platform: string, _id: string): Promise<File> {
    const response = await this.apiService.request(
      'delete',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/${_id}`,
    );

    const record = new File(response.record);
    this.onDelete.emit(record);

    return record;
  }

  public download(releaseId: string, platform: string, parameters: FileServiceDownloadOptions) {
    return this.apiService.request(
      'post',
      `${this.basePath}/${releaseId}/platforms/${platform}/files/download`,
      parameters,
      { observe: 'events', reportProgress: true, responseType: 'blob' },
    ) as Observable<any>;
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

  public upload(releaseId: string, platform: string, parameters: FileServiceUploadOptions) {
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
      { observe: 'events', reportProgress: true },
    ) as Observable<any>;
  }
}
