import { HttpEventType } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BuildModel } from '../models/build';
import { BuildStore } from '../states/build';
import { ApiService } from './api/api';
import { BaseService, BaseServiceFindQuery, ServiceEventEmitter } from './base';
import { EnvironmentService } from './environment';

export class BuildService {
  public emitter = new ServiceEventEmitter<BuildModel>();

  private baseService: BaseService<BuildModel>;

  constructor(
    private apiService: ApiService,
    private buildStore: BuildStore,
    private environmentService: EnvironmentService,
  ) {
    this.baseService = new BaseService<BuildModel>(
      this.apiService,
      this.emitter,
      BuildModel,
      this.buildStore,
    );
  }

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(namespaceId: string, query: any) {
    const url = this.getUrl(namespaceId);
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public create(namespaceId: string, parameters: Partial<BuildModel>, zip?: Blob) {
    const formData = new FormData();
    formData.append('record', JSON.stringify(parameters));

    // Only append zip field if supplied.
    if (zip) {
      formData.append('zip', zip);
    }

    const url = this.getUrl(namespaceId);
    const observable = this.apiService.observable('post', url, formData, {
      observe: 'events',
      reportProgress: true,
    }) as Observable<any>;
    observable.pipe(
      map((event) => {
        if (event.type === HttpEventType.Response) {
          const record = new BuildModel(event.body.record);
          this.emitter.emit('create', record);
          this.buildStore.add(record);
        }

        return event;
      }),
    );

    return observable;
  }

  /**
   * Deletes a Record.
   */
  public async delete(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.delete(_id, url);
  }

  /**
   * Downloads a Build.
   */
  public download(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.apiService.observable('get', `${url}/${_id}`, null, {
      observe: 'events',
      reportProgress: true,
      responseType: 'blob',
    }) as Observable<any>;
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(namespaceId: string, query: BaseServiceFindQuery) {
    const url = this.getUrl(namespaceId);
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(namespaceId: string, _id: string) {
    const url = this.getUrl(namespaceId);
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(namespaceId: string, _id: string, json: Partial<BuildModel>) {
    const url = this.getUrl(namespaceId);
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string) {
    return `${this.environmentService.apiUrl}/namespaces/${namespaceId}/builds`;
  }
}
