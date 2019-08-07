import * as mongoose from 'mongoose';

import { FindQuery, RestPermissions } from '../permissions/rest.permissions';

export class RestController<
  TDocument extends mongoose.Document,
  TModel extends mongoose.Model<TDocument>
> {
  public Model: mongoose.Model<mongoose.Document>;
  public permissions: RestPermissions<TDocument, TModel>;

  constructor(
    Model: mongoose.Model<mongoose.Document>,
    permissions: RestPermissions<TDocument, TModel>,
  ) {
    this.Model = Model;
    this.permissions = permissions;
  }

  public async count(where: any, user: any) {
    return this.permissions.count(where, {}, user);
  }

  public async create(params: any, override: any, user: any) {
    return this.permissions.create(params, override, user);
  }

  public async find(query: FindQuery, user: any) {
    return this.permissions.find(query, {}, user);
  }

  public async findOne(query: FindQuery, user: any) {
    const records = await this.permissions.find(query, {}, user);

    if (records.length === 0) {
      throw new Error('Record not found.');
    }

    return records[0];
  }

  public async remove(id: string, user: any) {
    const record = (await this.Model.findOne({ _id: id })) as TDocument;

    if (!record) {
      throw new Error('Record not found.');
    }

    return this.permissions.remove(record, user);
  }

  public async update(id: string, params: any, override: any, user: any) {
    const record = (await this.Model.findOne({ _id: id })) as TDocument;

    if (!record) {
      throw new Error('Record not found');
    }

    return this.permissions.update(record, params, override, user);
  }
}
