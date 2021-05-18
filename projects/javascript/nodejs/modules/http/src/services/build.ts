import { CoreOptions } from 'request';
import * as unzipper from 'unzipper';

import { apiUrl } from '../api-url';
import { BuildModel } from '../models';
import * as request from '../request';
import { buildStore } from '../stores';

export class BuildService {
  protected get url() {
    return `${apiUrl}/builds`;
  }

  /**
   * Creates a Record.
   */
  public async create(json: BuildModel, zip: Buffer): Promise<BuildModel> {
    const { record } = await request.promise(this.url, {
      formData: {
        build: JSON.stringify(json),
        zip: { options: { contentType: 'application/zip', filename: 'zip.zip' }, value: zip },
      },
      json: true,
      method: 'post',
    });
    buildStore.insert(record);
    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(_id: string): Promise<BuildModel> {
    buildStore.delete(_id);

    try {
      const { record } = await request.promise(`${this.url}/${_id}`, {
        json: true,
        method: 'delete',
      });
      return record;
    } catch {}
  }

  /**
   * Returns a stream of the unzipped files.
   */
  public async download(_id: string, files: Array<0 | 1> = []) {
    const options: CoreOptions = {};
    if (files?.length) {
      options.qs = { query: JSON.stringify({ files: files.join('') }) };
    }

    const response = await request.stream(`${this.url}/${_id}/files`, options);
    return response.pipe(unzipper.Parse());
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(query: any): Promise<BuildModel[]> {
    const { records } = await request.promise(this.url, {
      json: true,
      method: 'get',
      qs: { query: JSON.stringify(query) },
    });
    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(_id: string): Promise<BuildModel> {
    const { record } = await request.promise(`${this.url}/${_id}`, { json: true, method: 'get' });
    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(_id: string, json: BuildModel): Promise<BuildModel> {
    const { record } = await request.promise(`${this.url}/${_id}`, { json });
    buildStore.update(record);
    return record;
  }
}

export const buildService = new BuildService();
