import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { request } from '../request';

const HOST_NAMESPACE_API = process.env.E2E_HOST_NAMESPACE_API;
const chance = new Chance();

export class NamespaceModel {
  public _id: string;
  public accessControlList: any[];
  public createdAt: Date;
  public name: string;
  public updatedAt: Date;

  private static records: any[] = [];

  public static async create(params: Partial<NamespaceModel> = {}) {
    const defaults = {
      name: chance.hash(),
    };
    const path = `/namespaces`;

    const response = await request(HOST_NAMESPACE_API, 'post', path, { ...defaults, ...params });

    if (response.statusCode === 200) {
      this.records.push(response.body.record);
    }

    return response;
  }

  public static async delete(params: Partial<NamespaceModel>) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/namespaces/${params._id}`;

    return request(HOST_NAMESPACE_API, 'delete', path, params);
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

    const path = `/namespaces/${params._id}`;

    return request(HOST_NAMESPACE_API, 'get', path, params);
  }

  public static async update(params: any = {}) {
    if (!params._id) {
      throw new Error('Missing required parameters: _id.');
    }

    const path = `/namespaces/${params._id}`;

    return request(HOST_NAMESPACE_API, 'put', path, params);
  }
}
