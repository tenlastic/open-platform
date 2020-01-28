import * as deepmerge from 'deepmerge';
import * as mongoose from 'mongoose';

import { AccessControl, IOptions } from '../access-control';
import { filterObject } from '../filter-object';
import { filterRecord } from '../filter-record';
import { substituteReferenceValues } from '../substitute-reference-values';
import { substituteSubqueryValues } from '../substitute-subquery-values';

export interface IFindQuery {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
}

export class PermissionError extends Error {
  constructor() {
    super('User does not have permission to perform this action.');

    this.name = 'PermissionError';
  }
}

export class MongoosePermissions<TDocument extends mongoose.Document> {
  public accessControl: AccessControl;

  private Model: mongoose.Model<TDocument>;

  constructor(Model: mongoose.Model<TDocument>, options: IOptions) {
    this.accessControl = new AccessControl(options);
    this.Model = Model;
  }

  /**
   * Allows a user to retrive the count of a query.
   * @param where The user's where query.
   * @param override The system's where query.
   * @param user The user performing the query.
   */
  public async count(where: any, override: any = {}, user: any) {
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
    if (this.accessControl.options.populate) {
      stubRecord = await stubRecord.populate(this.accessControl.options.populate).execPopulate();
    }

    const createPermissions = this.accessControl.getFieldPermissions('create', stubRecord, user);
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
    const record = await this.Model.create(mergedParams);

    // Filter unauthorized attributes
    const readPermissions = this.accessControl.getFieldPermissions('read', record, user);
    return filterRecord(record, readPermissions);
  }

  /**
   * Removes a record if the user is authorized to do so.
   * @param record The record to remove.
   * @param user The user removing the record.
   */
  public async delete(record: TDocument, user: any) {
    const removePermissions = await this.accessControl.delete(record, user);

    if (!removePermissions) {
      throw new PermissionError();
    }

    record = await record.remove();

    // Filter unauthorized attributes
    const readPermissions = this.accessControl.getFieldPermissions('read', record, user);
    return filterRecord(record, readPermissions);
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

    let query = this.Model.find(where)
      .sort(override.sort || params.sort)
      .skip(override.skip || params.skip)
      .limit(override.limit || params.limit || 100)
      .select(override.select || params.select);

    if (this.accessControl.options.populate) {
      query = query.populate(this.accessControl.options.populate);
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
   * @param user The user performing the query.
   */
  public async findOne(params: IFindQuery, override: IFindQuery, user: any) {
    const results = await this.find(params, override, user);

    return results[0];
  }

  /**
   * Removes any unauthorized fields from a record.
   * @param record The record to filter attributes from.
   * @param user The user accessing the record.
   */
  public async read(record: TDocument, user: any) {
    const readPermissions = this.accessControl.getFieldPermissions('read', record, user);

    if (readPermissions.length === 0) {
      throw new PermissionError();
    }

    return filterRecord(record, readPermissions);
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
    const updatePermissions = this.accessControl.getFieldPermissions('update', record, user);

    if (updatePermissions.length === 0) {
      throw new PermissionError();
    }

    // Update record with authorized fields
    const filteredParams = filterObject(params, updatePermissions);
    const arrayMerge = (destinationArray, sourceArray) => sourceArray;
    const customMerge = key => {
      if (merge.includes(key)) {
        return deepmerge;
      }

      return (x, y) =>
        Array.isArray(x) || Array.isArray(y) ? arrayMerge(x, y) : Object.assign(x, y);
    };
    const mergedParams = deepmerge.all(
      [
        this.toPlainObject(record),
        this.toPlainObject(filteredParams),
        this.toPlainObject(override),
      ],
      { arrayMerge, customMerge },
    );

    Object.keys(mergedParams).forEach(key => (record[key] = mergedParams[key]));
    record = await record.save();

    // Remove unauthorized fields
    const readPermissions = this.accessControl.getFieldPermissions('read', record, user);
    return filterRecord(record, readPermissions);
  }

  /**
   * Creates a where query that filters out unauthorized records.
   * @param where The where clause for the query.
   * @param user The user performing the query.
   */
  public async where(where: any, user: any) {
    const query = await this.accessControl.find(user);

    if (query === null) {
      return null;
    }

    // Substitute calculated values into default find query.
    const results = substituteReferenceValues(query, { user });
    const substitutedQuery = await substituteSubqueryValues(this.Model.db, results);

    // Combines the two queries if a user-defined where clause is specified.
    if (where) {
      Object.keys(where).forEach(key => {
        if (key === '$and' && '$and' in substitutedQuery) {
          substitutedQuery.$and = substitutedQuery.$and.concat(where.$and);
        } else if (key === '$or' && '$or' in substitutedQuery) {
          substitutedQuery.$or = substitutedQuery.$or.concat(where.$or);
        } else if (key === '$nor' && '$nor' in substitutedQuery) {
          substitutedQuery.$nor = substitutedQuery.$nor.concat(where.$nor);
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

  private toPlainObject(obj: any) {
    return obj ? JSON.parse(JSON.stringify(obj)) : obj;
  }
}
