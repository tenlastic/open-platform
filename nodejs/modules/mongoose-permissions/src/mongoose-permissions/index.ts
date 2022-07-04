import * as deepmerge from 'deepmerge';
import * as mongoose from 'mongoose';

import {
  filterObject,
  isJsonValid,
  substituteReferenceValues,
  substituteSubqueryValues,
} from '../helpers';

export interface IFindQuery {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
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
  path: string;
  populate?: IPopulate | IPopulate[];
}

export interface IReferences<TDocument extends mongoose.Document> {
  key?: string;
  record?: TDocument;
  user?: any;
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
  public get populate() {
    return this.options.populate;
  }

  private Model: mongoose.Model<TDocument>;
  private options: IOptions;

  constructor(Model: mongoose.Model<TDocument>, options: IOptions) {
    this.Model = Model;
    this.options = options;
  }

  /**
   * Allows a user to retrive the count of a query.
   * @param where The user's where query.
   * @param override The system's where query.
   * @param user The user performing the query.
   */
  public async count(where: any, override: any, user: any) {
    const filteredWhere = await this.where(where, user);

    if (filteredWhere === null) {
      throw new PermissionError();
    }

    return this.Model.countDocuments({ ...filteredWhere, ...override }).exec();
  }

  /**
   * Allows a user to create a record with only the fields they are authorized to set.
   * @param params The parameters to initialize on the record.
   * @param override Parameters to apply regardless of filtering rules.
   * @param user The user creating the record.
   */
  public async create(params: Partial<TDocument>, override: Partial<TDocument>, user: any) {
    let stubRecord = new this.Model({ ...params, ...override } as any);
    if (this.options.populate) {
      stubRecord = await stubRecord.populate(this.options.populate);
    }

    const createPermissions = await this.getFieldPermissions('create', stubRecord, user);
    if (createPermissions.length === 0) {
      throw new PermissionError();
    }

    // Create record with authorized attributes
    const filteredParams = filterObject(params, createPermissions);
    const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
    const mergedParams = deepmerge(
      this.toPlainObject(filteredParams),
      this.toPlainObject(override),
      { arrayMerge: overwriteMerge },
    );

    return this.Model.create(mergedParams);
  }

  /**
   * Removes a record if the user is authorized to do so.
   * @param record The record to remove.
   * @param user The user removing the record.
   */
  public async delete(record: TDocument, user: any) {
    const removePermissions = await this.canDelete(record, user);

    if (!removePermissions) {
      throw new PermissionError();
    }

    return record.remove();
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param params The user's params.
   * @param override The system's params.
   * @param user The user performing the query.
   */
  public async find(params: IFindQuery, override: IFindQuery, user: any): Promise<TDocument[]> {
    const where = await this.where({ ...params.where, ...override.where }, user);

    if (where === null) {
      throw new PermissionError();
    }

    const query = this.Model.find(where)
      .sort(override.sort || params.sort)
      .skip(override.skip || params.skip)
      .limit(override.limit || params.limit || 100)
      .select(override.select || params.select);

    if (this.options.populate) {
      return query.populate(this.options.populate);
    }

    return query.exec();
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param params The user's params.
   * @param override The system's params.
   * @param user The user performing the query.
   */
  public async findOne(params: IFindQuery, override: IFindQuery, user: any) {
    const results = await this.find(params, override, user);
    return results[0];
  }

  /**
   * Returns the fields the user has permission to access.
   * @param key The key within the permissions configuration.
   * @param record The record being accessed.
   * @param user The user accessing the record.
   */
  public async getFieldPermissions(key: 'create' | 'read' | 'update', record: any, user: any) {
    const roles = this.options[key];

    if (!roles) {
      return [];
    }

    const references = this.getReferences(record, user);
    const role = this.getRole(references);
    const roleAttributes = roles ? roles[role] : undefined;

    return roleAttributes || roles.default || [];
  }

  /**
   * Removes any unauthorized fields from a record.
   * @param record The record to filter attributes from.
   * @param user The user accessing the record.
   */
  public async read(record: TDocument, user: any): Promise<Partial<TDocument>> {
    const readPermissions = await this.getFieldPermissions('read', record, user);

    if (readPermissions.length === 0) {
      throw new PermissionError();
    }

    const object = record.toObject();
    return filterObject(object, readPermissions);
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
    merge: string[] = [],
  ) {
    const updatePermissions = await this.getFieldPermissions('update', record, user);

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
      [
        this.toPlainObject(record),
        this.toPlainObject(filteredParams),
        this.toPlainObject(override),
      ],
      { arrayMerge, customMerge },
    );

    Object.keys(mergedParams).forEach((key) => (record[key] = mergedParams[key]));
    return record.save();
  }

  /**
   * Creates a where query that filters out unauthorized records.
   * @param where The where clause for the query.
   * @param user The user performing the query.
   */
  public async where(where: any, user: any) {
    const references = this.getReferences(null, user);
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
  private async canDelete(record: any, user: any) {
    if (!this.options.delete) {
      return false;
    }

    const references = this.getReferences(record, user);
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

  /**
   * Gets the query references.
   */
  private getReferences(record: TDocument, user: any): IReferences<TDocument> {
    return {
      key: typeof user === 'string' ? user : null,
      record: record ? this.toPlainObject(record, true) : null,
      user: typeof user !== 'string' ? this.toPlainObject(user, true) : null,
    };
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
   * Primarily used to convert ObjectId instances into regular strings.
   */
  private toPlainObject(obj: any, virtuals = false) {
    const json = obj?.toJSON ? obj.toJSON({ virtuals }) : obj;
    return json ? JSON.parse(JSON.stringify(json)) : json;
  }
}
