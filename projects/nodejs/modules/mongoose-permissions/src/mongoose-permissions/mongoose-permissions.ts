import * as mongoose from 'mongoose';

import { isJsonValid } from '../is-json-valid/is-json-valid';

export interface IFindQuery {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
}

export interface IOptions {
  create: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
  delete: {
    base?: boolean;
    roles?: { [key: string]: boolean };
  };
  find: {
    base?: any;
    roles?: { [key: string]: any };
  };
  populate?: IPopulate;
  read: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
  roles: IRole[];
  update: {
    base?: string[];
    roles?: { [key: string]: string[] };
  };
}

export interface IPopulate {
  path: string;
  populate?: IPopulate;
}

export interface IRole {
  name: string;
  query: any;
}

export class PermissionError extends Error {
  constructor() {
    super('User does not have permission to perform this action.');

    this.name = 'PermissionError';
  }
}

export class MongoosePermissions<TDocument extends mongoose.Document> {
  public populateOptions: IPopulate;

  private Model: mongoose.Model<TDocument>;
  private options: IOptions;

  constructor(Model: mongoose.Model<TDocument>, options: IOptions) {
    this.populateOptions = options.populate;

    this.Model = Model;
    this.options = options;
  }

  /**
   * Allows a user to retrive the count of a query.
   * @param where The user's where query.
   * @param override The system's where query.
   * @param user The user performing the query.
   */
  public async count(where: any, override: any = {}, user: any) {
    const filteredWhere = await this.where(where, user);

    return this.Model.countDocuments({ ...filteredWhere, ...override }).exec();
  }

  /**
   * Allows a user to create a record with only the fields they are authorized to set.
   * @param params The parameters to initialize on the record.
   * @param override Parameters to apply regardless of filtering rules.
   * @param user The user creating the record.
   */
  public async create(params: Partial<TDocument>, override: Partial<TDocument>, user: any) {
    const createPermissions = await this.createPermissions(user);

    if (createPermissions.length === 0) {
      throw new PermissionError();
    }

    // Create record with authorized attributes
    const filteredParams = this.filterObject(params, createPermissions);
    const record = await this.Model.create({ ...filteredParams, ...override });

    // Filter unauthorized attributes
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
  }

  public async createPermissions(user: any) {
    if (!this.options.create) {
      return [];
    }

    const attributes = this.options.create.base || [];

    const role = this.getRole(null, user);
    const roles = this.options.create.roles;
    const roleAttributes = roles && roles[role] ? roles[role] : [];

    return attributes.concat(roleAttributes);
  }

  /**
   * Removes a record if the user is authorized to do so.
   * @param record The record to remove.
   * @param user The user removing the record.
   */
  public async delete(record: TDocument, user: any) {
    const removePermissions = await this.deletePermissions(record, user);

    if (!removePermissions) {
      throw new PermissionError();
    }

    record = await record.remove();

    // Filter unauthorized attributes
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
  }

  public async deletePermissions(record: TDocument, user: any) {
    if (!this.options.delete) {
      return false;
    }

    const role = this.getRole(record, user);
    const roles = this.options.delete.roles || {};

    if (role in roles) {
      return roles[role];
    }

    return this.options.delete.base || false;
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param params The user's params.
   * @param override The system's params.
   * @param user The user performing the params.
   */
  public async find(params: IFindQuery, override: IFindQuery, user: any) {
    const where = await this.where(params.where, user);

    let query = this.Model.find({ ...where, ...override.where })
      .sort(override.sort || params.sort)
      .skip(override.skip || params.skip)
      .limit(override.limit || params.limit || 100)
      .select(override.select || params.select);

    if (this.options.populate) {
      query = query.populate(this.options.populate);
    }

    const records = (await query.exec()) as TDocument[];
    const promises = records.map(record => this.read(record, user));

    return Promise.all(promises);
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param params The user's params.
   * @param override The system's params.
   * @param user The user performing the params.
   */
  public async findOne(params: IFindQuery, override: IFindQuery, user: any) {
    const results = await this.find(params, override, user);

    return results[0];
  }

  public async findPermissions(user: any) {
    if (!this.options.find) {
      return null;
    }

    const query = this.options.find.base;

    const role = this.getRole(null, user);
    const roles = this.options.find.roles;
    const roleAttributes = roles ? roles[role] : undefined;

    if (roleAttributes === null || (roleAttributes === undefined && !query)) {
      return null;
    }

    return Object.assign(query || {}, roleAttributes || {});
  }

  /**
   * Removes any unauthorized fields from a record.
   * @param record The record to filter attributes from.
   * @param user The user accessing the record.
   */
  public async read(record: TDocument, user: any) {
    const readPermissions = await this.readPermissions(record, user);

    if (readPermissions.length === 0) {
      throw new PermissionError();
    }

    return this.filterRecord(record, readPermissions);
  }

  public async readPermissions(record: TDocument, user: any) {
    if (!this.options.read) {
      return [];
    }

    const attributes = this.options.read.base || [];

    const role = this.getRole(record, user);
    const roles = this.options.read.roles;
    const roleAttributes = roles && roles[role] ? roles[role] : [];

    return attributes.concat(roleAttributes);
  }

  /**
   * Allows a user to update a record with only the fields they are authorized to set.
   * @param record The record to update.
   * @param params The parameters to update on the record.
   * @param override Parameters to apply regardless of filtering rules.
   * @param user The user updating the record.
   */
  public async update(
    record: TDocument,
    params: Partial<TDocument>,
    override: Partial<TDocument>,
    user: any,
  ) {
    const updatePermissions = await this.updatePermissions(record, user);

    if (updatePermissions.length === 0) {
      throw new PermissionError();
    }

    // Update record with authorized fields
    const filteredParams = this.filterObject(params, updatePermissions);
    Object.assign(record, filteredParams, override);
    record = await this.Model.findOneAndUpdate(
      { _id: record._id },
      { ...filteredParams, ...override },
      { new: true },
    );

    // Remove unauthorized fields
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
  }

  public async updatePermissions(record: TDocument, user: any) {
    if (!this.options.update) {
      return [];
    }

    const attributes = this.options.update.base || [];

    const role = this.getRole(record, user);
    const roles = this.options.update.roles;
    const roleAttributes = roles && roles[role] ? roles[role] : [];

    return attributes.concat(roleAttributes);
  }

  /**
   * Creates a where query that filters out unauthorized records.
   * @param where The where clause for the query.
   * @param user The user performing the query.
   */
  public async where(where: any, user: any) {
    const query = await this.findPermissions(user);

    if (query === null) {
      throw new PermissionError();
    }

    if (!where) {
      return query;
    }

    // Combines the two queries
    Object.keys(where).forEach(key => {
      if (key === '$and' && '$and' in query) {
        query.$and = query.$and.concat(where.$and);
      } else if (key === '$or' && '$or' in query) {
        query.$or = query.$or.concat(where.$or);
      } else if (key === '$nor' && '$nor' in query) {
        query.$nor = query.$nor.concat(where.$nor);
      } else if (key in query) {
        if (!query.$and) {
          query.$and = [];
        }

        query.$and.push({ [key]: query[key] });
        query.$and.push({ [key]: where[key] });

        delete query[key];
      } else {
        query[key] = where[key];
      }
    });

    return query;
  }

  /**
   * Removes any unauthorized attributes from an object.
   * @param object The object to remove unauthorized attributes from.
   * @param permissions An array of authorized key names.
   */
  private filterObject(object: any, permissions: string[]) {
    const copy: any = {};

    for (const key in object) {
      if (permissions.indexOf(key) >= 0) {
        copy[key] = object[key];
      }
    }

    return copy;
  }

  /**
   * Removes any unauthorized attributes from a record. This directly modifies the record.
   * @param record The record to remove unauthorized attributes from.
   * @param permissions An array of authorized key names.
   */
  private filterRecord(record: TDocument, permissions: string[]) {
    const { _doc } = record as any;

    for (const key in _doc) {
      if (permissions.indexOf(key) < 0) {
        delete _doc[key];
      }
    }

    return record;
  }

  private getRole(record: TDocument, user: any) {
    const json = {
      record: record ? record.toObject() : null,
      user: user && user.toObject ? user.toObject() : user,
    };

    try {
      for (const role of this.options.roles) {
        if (isJsonValid(json, role.query)) {
          return role.name;
        }
      }
    } catch {}

    return 'default';
  }
}
