import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { DatabaseDocument } from '../../src/models';
import { request } from '../request';

const chance = new Chance();

export class DatabaseModel {
  private static records: any[] = [];

  public static async create(params: Partial<DatabaseDocument> = {}, user: any = {}) {
    const defaults = {
      name: chance.name(),
      userId: mongoose.Types.ObjectId().toHexString(),
    };
    const path = `/databases`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    const response = await request('post', path, { ...defaults, ...params }, user);

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<DatabaseDocument>, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('delete', path, params, user);
  }

  public static async deleteAll() {
    return Promise.all(this.records.map(r => this.delete({ _id: r._id })));
  }

  public static async findOne(params: any = {}, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('get', path, params, user);
  }

  public static async update(params: any = {}, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/databases/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return request('put', path, params, user);
  }
}
