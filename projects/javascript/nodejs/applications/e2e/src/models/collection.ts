import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { request } from '../request';

const HOST_DATABASE_API = process.env.E2E_HOST_DATABASE_API;
const chance = new Chance();

export class CollectionModel {
  public _id: string;
  public createdAt: Date;
  public databaseId: string;
  public jsonSchema: any;
  public name: string;
  public permissions: any;
  public updatedAt: Date;

  private static records: any[] = [];

  public static async create(params: Partial<CollectionModel> = {}) {
    if (!params.databaseId) {
      throw new Error('Missing required parameters: databaseId.');
    }

    const defaults = {
      name: chance.hash(),
    };
    const path = `/databases/${params.databaseId}/collections`;

    const response = await request(HOST_DATABASE_API, 'post', path, { ...defaults, ...params });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<CollectionModel>) {
    if (!params._id || !params.databaseId) {
      throw new Error('Missing required parameters: _id and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params._id}`;

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
    if (!params._id || !params.databaseId) {
      throw new Error('Missing required parameters: _id and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params._id}`;

    return request(HOST_DATABASE_API, 'get', path, params);
  }

  public static async update(params: any = {}) {
    if (!params._id || !params.databaseId) {
      throw new Error('Missing required parameters: _id and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params._id}`;

    return request(HOST_DATABASE_API, 'put', path, params);
  }
}
