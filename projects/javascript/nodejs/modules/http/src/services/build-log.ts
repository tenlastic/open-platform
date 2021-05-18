import { apiUrl } from '../api-url';
import { BuildLogModel } from '../models';
import * as request from '../request';
import { buildLogStore } from '../stores';

export class BuildLogService {
  /**
   * Creates a Record.
   */
  public async create(buildId: string, json: BuildLogModel): Promise<BuildLogModel> {
    const url = this.getUrl(buildId);
    const { record } = await request.promise(url, { json, method: 'post' });
    buildLogStore.insert(record);
    return record;
  }

  /**
   * Deletes a Record.
   */
  public async delete(buildId: string, _id: string): Promise<BuildLogModel> {
    buildLogStore.delete(_id);

    try {
      const url = this.getUrl(buildId);
      const { record } = await request.promise(`${url}/${_id}`, {
        json: true,
        method: 'delete',
      });
      return record;
    } catch {}
  }

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(buildId: string, query: any): Promise<BuildLogModel[]> {
    const url = this.getUrl(buildId);
    const { records } = await request.promise(url, {
      json: true,
      method: 'get',
      qs: { query: JSON.stringify(query) },
    });
    return records;
  }

  /**
   * Returns a Record by ID.
   */
  public async findOne(buildId: string, _id: string): Promise<BuildLogModel> {
    const url = this.getUrl(buildId);
    const { record } = await request.promise(`${url}/${_id}`, { json: true, method: 'get' });
    return record;
  }

  /**
   * Updates a Record.
   */
  public async update(buildId: string, _id: string, json: BuildLogModel): Promise<BuildLogModel> {
    const url = this.getUrl(buildId);
    const { record } = await request.promise(`${url}/${_id}`, { json });
    buildLogStore.update(record);
    return record;
  }

  private getUrl(buildId: string) {
    return `${apiUrl}/builds/${buildId}/logs`;
  }
}

export const buildLogService = new BuildLogService();
