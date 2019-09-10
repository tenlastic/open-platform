import * as Chance from 'chance';

import { request } from '../request';

const HOST_DATABASE_API = process.env.E2E_HOST_DATABASE_API;
const chance = new Chance();

export class DatabaseModel {
  public _id: string;
  public createdAt: Date;
  public name: string;
  public namespaceId: string;
  public updatedAt: Date;
  public userId: string;

  private static records: any[] = [];

  public static async create(params: Partial<DatabaseModel> = {}) {
    if (!params.namespaceId) {
      throw new Error('Missing required parameters: namespaceId.');
    }

    const defaults = {
      name: chance.hash(),
    };
    const path = `/databases`;

    const response = await request(HOST_DATABASE_API, 'post', path, { ...defaults, ...params });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<DatabaseModel>) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;

    return request(HOST_DATABASE_API, 'delete', path, params);
  }

  public static async deleteAll() {
    return Promise.all(
      this.records.map((r, i) => {
        this.records.splice(i, 1);
        return this.delete(r);
      }),
    );
  }

  public static async findOne(params: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;

    return request(HOST_DATABASE_API, 'get', path, params);
  }

  public static async update(params: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;

    return request(HOST_DATABASE_API, 'put', path, params);
  }
}
