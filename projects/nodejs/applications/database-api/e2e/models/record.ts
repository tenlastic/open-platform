import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { RecordDocument } from '../../src/models';
import { request } from '../request';

const chance = new Chance();

export class RecordModel {
  private static records: any[] = [];

  public static async create(params: Partial<RecordDocument> = {}, user: any = {}) {
    if (!params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const defaults = {};
    const path = `/databases/${params.databaseId}/collections/${params.collectionId}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    const response = await request('post', path, { ...defaults, ...params }, user);

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<RecordDocument>, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('delete', path, params, user);
  }

  public static async deleteAll() {
    return Promise.all(this.records.map(r => this.delete(r)));
  }

  public static async findOne(params: any = {}, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('get', path, params, user);
  }

  public static async update(params: any = {}, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('put', path, params, user);
  }
}
