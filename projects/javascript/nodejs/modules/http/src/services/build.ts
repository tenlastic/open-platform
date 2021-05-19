import { CoreOptions } from 'request';
import * as unzipper from 'unzipper';

import { apiUrl } from '../api-url';
import { BuildModel } from '../models/build';
import * as request from '../request';
import { BaseService, ServiceEventEmitter } from './base';

export class BuildService {
  public emitter = new ServiceEventEmitter<BuildModel>();
  private baseService = new BaseService<BuildModel>(this.emitter, BuildModel);

  /**
   * Returns the number of Records satisfying the query.
   */
  public async count(query: any) {
    const url = this.getUrl();
    return this.baseService.count(query, url);
  }

  /**
   * Creates a Record.
   */
  public async create(json: Partial<BuildModel>, zip: Buffer) {
    const url = this.getUrl();
    const response = await request.promise(url, {
      formData: {
        build: JSON.stringify(json),
        zip: { options: { contentType: 'application/zip', filename: 'zip.zip' }, value: zip },
      },
      json: true,
      method: 'post',
    });

    const record = new BuildModel(response.record);
    this.emitter.emit('create', record);

    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string) {
    const url = this.getUrl();
    return this.baseService.delete(_id, url);
  }

  /**
   * Returns a stream of the unzipped files.
   */
  public async download(_id: string, files: Array<0 | 1> = []) {
    const options: CoreOptions = {};
    if (files?.length) {
      options.qs = { query: JSON.stringify({ files: files.join('') }) };
    }

    const url = this.getUrl();
    const response = await request.stream(`${url}/${_id}/files`, options);

    return response.pipe(unzipper.Parse());
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any) {
    const url = this.getUrl();
    return this.baseService.find(query, url);
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string) {
    const url = this.getUrl();
    return this.baseService.findOne(_id, url);
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: Partial<BuildModel>) {
    const url = this.getUrl();
    return this.baseService.update(_id, json, url);
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${apiUrl}/builds`;
  }
}

export const buildService = new BuildService();
