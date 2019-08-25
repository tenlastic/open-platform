import * as e2e from '@tenlastic/e2e';

import { RecordDocument } from '../../src/models';

export class RecordModel {
  private static records: any[] = [];

  public static async create(params: Partial<RecordDocument> = {}, user: any = {}) {
    if (!params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const defaults = {};
    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/records`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    const response = await e2e.request('post', path, { ...defaults, ...params }, { user });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<RecordDocument>, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/records/${
      params._id
    }`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('delete', path, params, { user });
  }

  public static async deleteAll() {
    return Promise.all(this.records.map(r => this.delete(r)));
  }

  public static async findOne(params: any = {}, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/records/${
      params._id
    }`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('get', path, params, { user });
  }

  public static async update(params: any = {}, user: any = {}) {
    if (!params._id || !params.collectionId || !params.databaseId) {
      throw new Error('Missing required parameters: _id, collectionId, and databaseId.');
    }

    const path = `/databases/${params.databaseId}/collections/${params.collectionId}/records/${
      params._id
    }`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('put', path, params, { user });
  }
}
