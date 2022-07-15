import * as deepmerge from 'deepmerge';
import * as mongoose from 'mongoose';

import {
  filterObject,
  isJsonValid,
  substituteReferenceValues,
  substituteSubqueryValues,
  toPlainObject,
} from '../helpers';

export class PermissionError extends Error {
  constructor() {
    super('User does not have permission to perform this action.');

    this.name = 'PermissionError';
  }
}

export interface ICredentials {
  apiKey?: string;
  authorization?: mongoose.Document;
  user?: mongoose.Document;
}

export interface IFindQuery<TDocument extends mongoose.Document> {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: mongoose.FilterQuery<TDocument>;
}

export interface IOptions {
  create?: { [key: string]: string[] };
  delete?: { [key: string]: boolean };
  find?: { [key: string]: any };
  populate?: IPopulate[];
  read?: { [key: string]: string[] };
  roles?: IRole[];
  update?: { [key: string]: string[] };
}

export interface IPopulate {
  match?: any;
  path: string;
  populate?: IPopulate[];
}

export interface IReferences<TDocument extends mongoose.Document> {
  apiKey?: string;
  authorization?: any;
  record?: TDocument;
  user?: any;
}

export interface IRole {
  name: string;
  query: any;
}

export class MongoosePermissions<TDocument extends mongoose.Document> {
  private Model: mongoose.Model<TDocument>;
  private options: IOptions;

  constructor(Model: mongoose.Model<TDocument>, options: IOptions) {
    this.Model = Model;
    this.options = options;
  }

  /**
   * Allows a user to retrive the count of a query.
   * @param credentials The credentials for the query.
   * @param override The system's where query.
   * @param where The user's where query.
   */
  public async count(credentials: ICredentials, override: any, where: any) {
    const filteredWhere = await this.where(credentials, where);

    if (filteredWhere === null) {
      throw new PermissionError();
    }

    return this.Model.countDocuments({ ...filteredWhere, ...override }).exec();
  }

  /**
   * Allows a user to create a record with only the fields they are authorized to set.
   * @param credentials The credentials for creating the record.
   * @param override Parameters to apply regardless of filtering rules.
   * @param params The parameters to initialize on the record.
   */
  public async create(
    credentials: ICredentials,
    override: Partial<TDocument>,
    params: Partial<TDocument>,
  ) {
    let stubRecord = new this.Model({ ...params, ...override } as any);

    if (this.options.populate) {
      const references = this.getReferences(credentials, null);
      const populate = substituteReferenceValues(this.options.populate, references);
      stubRecord = await stubRecord.populate(populate);
    }

    const createPermissions = await this.getFieldPermissions(credentials, 'create', stubRecord);
    if (createPermissions.length === 0) {
      throw new PermissionError();
    }

    // Create record with authorized attributes
    const filteredParams = filterObject(params, createPermissions);
    const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
    const mergedParams = deepmerge(toPlainObject(filteredParams), toPlainObject(override), {
      arrayMerge: overwriteMerge,
    });

    return this.Model.create(mergedParams);
  }

  /**
   * Removes a record if the user is authorized to do so.
   * @param credentials The credentials for removing the record.
   * @param record The record to remove.
   */
  public async delete(credentials: ICredentials, record: TDocument) {
    await this.populateRecord(credentials, record);

    const references = this.getReferences(credentials, record);
    const removePermissions = await this.canDelete(references);
    if (!removePermissions) {
      throw new PermissionError();
    }

    return record.remove();
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param credentials The credentials for the query.
   * @param override The system's params.
   * @param params The user's params.
   */
  public async find(
    credentials: ICredentials,
    override: IFindQuery<TDocument>,
    params: IFindQuery<TDocument>,
  ): Promise<TDocument[]> {
    const where = await this.where(credentials, { ...params.where, ...override.where });
    if (where === null) {
      throw new PermissionError();
    }

    const query = this.Model.find(where)
      .sort(override.sort || params.sort)
      .skip(override.skip || params.skip)
      .limit(override.limit || params.limit || 100)
      .select(override.select || params.select);

    if (this.options.populate) {
      const references = this.getReferences(credentials, null);
      const populate = substituteReferenceValues(this.options.populate, references);
      return query.populate(populate);
    }

    return query.exec();
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param credentials The credentials for the query.
   * @param override The system's params.
   * @param params The user's params.
   */
  public async findOne(
    credentials: ICredentials,
    override: IFindQuery<TDocument>,
    params: IFindQuery<TDocument>,
  ) {
    const results = await this.find(credentials, { ...override, limit: 1 }, params);
    return results[0];
  }

  /**
   * Returns the fields the user has permission to access.
   * @param credentials The credentials for accessing the record.
   * @param key The key within the permissions configuration.
   * @param record The record being accessed.
   */
  public async getFieldPermissions(
    credentials: ICredentials,
    key: 'create' | 'read' | 'update',
    record: TDocument,
  ) {
    await this.populateRecord(credentials, record);

    const roles = this.options[key];
    if (!roles) {
      return [];
    }

    const references = this.getReferences(credentials, record);
    const role = this.getRole(references);
    const roleAttributes = roles ? roles[role] : undefined;

    return roleAttributes || roles.default || [];
  }

  /**
   * Removes any unauthorized fields from a record.
   * @param credentials The credentials for accessing the record.
   * @param record The record to filter attributes from.
   */
  public async read(credentials: ICredentials, record: TDocument): Promise<Partial<TDocument>> {
    if (!record) {
      return record;
    }

    const readPermissions = await this.getFieldPermissions(credentials, 'read', record);
    if (readPermissions.length === 0) {
      throw new PermissionError();
    }

    const object = record.toObject();
    return filterObject(object, readPermissions);
  }

  /**
   * Allows a user to update a record with only the fields they are authorized to set.
   * @param credentials THe credentials for updating the record.
   * @param override Parameters to apply regardless of filtering rules.
   * @param params The parameters to update on the record.
   * @param record The record to update.
   */
  public async update(
    credentials: ICredentials,
    override: Partial<TDocument>,
    params: Partial<TDocument>,
    record: TDocument,
    merge: string[] = [],
  ) {
    const updatePermissions = await this.getFieldPermissions(credentials, 'update', record);

    if (updatePermissions.length === 0) {
      throw new PermissionError();
    }

    // Update record with authorized fields
    const filteredParams = filterObject(params, updatePermissions);
    const arrayMerge = (destinationArray, sourceArray) => sourceArray;
    const customMerge = (key) => {
      if (merge.includes(key)) {
        return deepmerge;
      }

      return (x, y) => (Array.isArray(x) || Array.isArray(y) ? arrayMerge(x, y) : y);
    };
    const mergedParams = deepmerge.all(
      [toPlainObject(record), toPlainObject(filteredParams), toPlainObject(override)],
      { arrayMerge, customMerge },
    );

    Object.keys(mergedParams).forEach((key) => (record[key] = mergedParams[key]));
    return record.save();
  }

  /**
   * Creates a where query that filters out unauthorized records.
   * @param credentials The credentials for the query.
   * @param where The where clause for the query.
   */
  public async where(credentials: ICredentials, where: mongoose.FilterQuery<TDocument>) {
    const references = this.getReferences(credentials, null);
    const query = await this.getFindQuery(references);
    if (query === null) {
      return null;
    }

    // Substitute calculated values into default find query.
    const results = substituteReferenceValues(query, references);
    const substitutedQuery = await substituteSubqueryValues(this.Model.db, results);

    // Combines the two queries if a user-defined where clause is specified.
    if (where) {
      Object.keys(where).forEach((key) => {
        if (key === '$and' && '$and' in substitutedQuery) {
          substitutedQuery.$and = substitutedQuery.$and.concat(where.$and);
        } else if (key in substitutedQuery) {
          if (!substitutedQuery.$and) {
            substitutedQuery.$and = [];
          }

          substitutedQuery.$and.push({ [key]: substitutedQuery[key] });
          substitutedQuery.$and.push({ [key]: where[key] });

          delete substitutedQuery[key];
        } else {
          substitutedQuery[key] = where[key];
        }
      });
    }

    return substitutedQuery;
  }

  /**
   * Returns whether or not a user may delete a record.
   */
  private async canDelete(references: IReferences<TDocument>) {
    if (!this.options.delete) {
      return false;
    }

    const role = this.getRole(references);
    const roles = this.options.delete || {};

    if (role in roles) {
      return roles[role];
    }

    return roles.default || false;
  }

  /**
   * Returns the base find query for a user.
   */
  private async getFindQuery(references: IReferences<TDocument>) {
    if (!this.options.find) {
      return null;
    }

    const role = this.getRole(references);
    const roles = this.options.find;
    const roleAttributes = roles ? roles[role] : undefined;

    if (roleAttributes === null || (roleAttributes === undefined && !roles.default)) {
      return null;
    }

    return roleAttributes || roles.default || {};
  }

  private getPaths(populate: IPopulate) {
    const paths = [populate.path];

    if (populate.populate) {
      const subpaths = populate.populate.map((p) => this.getPaths(p)).flat();
      paths.push(...subpaths);
    }

    return paths;
  }

  /**
   * Gets the query references.
   */
  private getReferences(credentials: ICredentials, record: TDocument) {
    const { apiKey, authorization, user } = credentials;

    return {
      apiKey: apiKey ?? null,
      authorization: authorization ? toPlainObject(authorization, true) : null,
      record: record ? toPlainObject(record, true) : null,
      user: user ? toPlainObject(user, true) : null,
    } as IReferences<TDocument>;
  }

  /**
   * Returns the role of the user accessing a record.
   */
  private getRole(references: IReferences<TDocument>) {
    if (!this.options.roles) {
      return 'default';
    }

    for (const role of this.options.roles) {
      try {
        if (isJsonValid(references, role.query)) {
          return role.name;
        }
      } catch {}
    }

    return 'default';
  }

  /**
   * Populates a record if paths have not been populated already.
   */
  private populateRecord(credentials: ICredentials, record: mongoose.Document) {
    if (!this.options.populate) {
      return Promise.resolve(record);
    }

    const paths = this.options.populate.map((p) => this.getPaths(p)).flat() || [];

    for (const path of paths) {
      if (!record.populated(path)) {
        const references = this.getReferences(credentials, null);
        const populate = substituteReferenceValues(this.options.populate, references);
        return record.populate(populate);
      }
    }

    return Promise.resolve(record);
  }
}
