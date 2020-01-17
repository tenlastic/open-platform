import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { request } from '../request';

const HOST_AUTHENTICATION_API = process.env.E2E_HOST_AUTHENTICATION_API;
const chance = new Chance();

export class UserModel {
  public _id: string;
  public createdAt: Date;
  public email: string;
  public username: string;
  public updatedAt: Date;

  private static records: any[] = [];

  constructor(params: Partial<UserModel> = {}) {
    Object.assign(this, params);
  }

  public static async create(params: any = {}) {
    const defaults = {
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 20 }),
    };
    const path = `/users`;

    const response = await request(HOST_AUTHENTICATION_API, 'post', path, {
      ...defaults,
      ...params,
    });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: any) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;

    return request(HOST_AUTHENTICATION_API, 'delete', path, params);
  }

  public static async deleteAll() {
    return Promise.all(
      this.records.map((r, i) => {
        this.records.splice(i, 1);
        return this.delete({ _id: r._id });
      }),
    );
  }

  public static async findOne(params: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;

    return request(HOST_AUTHENTICATION_API, 'get', path, params);
  }

  public static async update(params: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/users/${params._id}`;

    return request(HOST_AUTHENTICATION_API, 'put', path, params);
  }
}
