import * as e2e from '@tenlastic/e2e';
import * as Chance from 'chance';

import { UserDocument } from '../../src/models';

const chance = new Chance();

export class UserModel {
  private static records: any[] = [];

  public static async create(params: Partial<UserDocument> = {}, user: any = {}) {
    const defaults = {
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 20 }),
    };
    const path = `/users`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    const response = await e2e.request('post', path, { ...defaults, ...params }, { user });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<UserDocument>, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('delete', path, params, { user });
  }

  public static async deleteAll() {
    return Promise.all(
      this.records.map((r, i) => {
        this.records.splice(i, 1);
        return this.delete({ _id: r._id });
      }),
    );
  }

  public static async findOne(params: any = {}, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('get', path, params, { user });
  }

  public static async update(params: any = {}, user: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;
    user = { activatedAt: new Date(), roles: ['Admin'], ...user };

    return e2e.request('put', path, params, { user });
  }
}
