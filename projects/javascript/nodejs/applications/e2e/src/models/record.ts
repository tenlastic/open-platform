import * as mongoose from 'mongoose';

const HOST_DATABASE_API = process.env.E2E_HOST_DATABASE_API;
import { request } from '../request';

export class RecordModel {
  public _id: string;
  public collectionId: string;
  public properties: any;
  public databaseId: string;
  public createdAt: Date;
  public name: string;
  public updatedAt: Date;

  private static records: any[] = [];

  public static async create(params: Partial<RecordModel> = {}) {
    if (!params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const defaults = {};
    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/records`;

    const response = await request(HOST_DATABASE_API, 'post', path, { ...defaults, ...params });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<RecordModel>) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const { _id, collectionId, databaseId } = params;
    const path = `/databases/${databaseId}/collections/${collectionId}/records/${_id}`;

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
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const { _id, collectionId, databaseId } = params;
    const path = `/databases/${databaseId}/collections/${collectionId}/records/${_id}`;

    return request(HOST_DATABASE_API, 'get', path, params);
  }

  public static async update(params: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const { _id, collectionId, databaseId } = params;
    const path = `/databases/${databaseId}/collections/${collectionId}/records/${_id}`;

    return request(HOST_DATABASE_API, 'put', path, params);
  }
}
