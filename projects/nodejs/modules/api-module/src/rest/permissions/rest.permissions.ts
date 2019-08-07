import * as mongoose from 'mongoose';

export interface FindQuery {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
}

export abstract class RestPermissions<
  TDocument extends mongoose.Document,
  TModel extends mongoose.Model<TDocument>
> {
  public Model: TModel;
  public populatedFields: string[] = [];

  public abstract createPermissions(user: any): Promise<string[]>;
  public abstract findPermissions(user: any): Promise<any>;
  public abstract readPermissions(record: TDocument, user: any): Promise<string[]>;
  public abstract removePermissions(record: TDocument, user: any): Promise<boolean>;
  public abstract updatePermissions(record: TDocument, user: any): Promise<string[]>;

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
      throw new Error('User does not have permission to perform this action.');
    }

    // Create record with authorized attributes
    const filteredParams = this.filterObject(params, createPermissions);
    const record = await this.Model.create({ ...filteredParams, ...(override as any) });

    // Filter unauthorized attributes
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
  }

  /**
   * Allows a user to retrieve records they are allowed to access.
   * Performs query population to provide any related documents for access-level calculations.
   * @param params The user's params.
   * @param override The system's params.
   * @param user The user performing the params.
   */
  public async find(params: FindQuery, override: FindQuery, user: any) {
    const where = await this.where(params.where, user);

    let query = this.Model.find({ ...where, ...override.where })
      .sort(override.sort || params.sort)
      .skip(override.skip || params.skip)
      .limit(override.limit || params.limit || 100)
      .select(override.select || params.select);

    this.populatedFields.forEach(populatedField => {
      query = query.populate(populatedField);
    });

    const records = (await query.exec()) as TDocument[];
    const promises = records.map(record => this.read(record, user));

    return Promise.all(promises);
  }

  /**
   * Removes any unauthorized fields from a record.
   * @param record The record to filter attributes from.
   * @param user The user accessing the record.
   */
  public async read(record: TDocument, user: any) {
    const readPermissions = await this.readPermissions(record, user);

    if (readPermissions.length === 0) {
      throw new Error('User does not have permission to perform this action.');
    }

    return this.filterRecord(record, readPermissions);
  }

  /**
   * Removes a record if the user is authorized to do so.
   * @param record The record to remove.
   * @param user The user removing the record.
   */
  public async remove(record: TDocument, user: any) {
    const removePermissions = await this.removePermissions(record, user);

    if (!removePermissions) {
      throw new Error('User does not have permission to perform this action.');
    }

    record = await record.remove();

    // Filter unauthorized attributes
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
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
      throw new Error('User does not have permission to perform this action.');
    }

    // Update record with authorized fields
    const filteredParams = this.filterObject(params, updatePermissions);
    Object.assign(record, filteredParams, override);
    record = await record.save();

    // Remove unauthorized fields
    const readPermissions = await this.readPermissions(record, user);
    return this.filterRecord(record, readPermissions);
  }

  /**
   * Creates a where query that filters out unauthorized records.
   * @param where The where clause for the query.
   * @param user The user performing the query.
   */
  public async where(where: any, user: any) {
    const query = await this.findPermissions(user);

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

  protected async populate(object: TDocument, idField: string, field: string) {
    if (object[idField] && !object.populated(field)) {
      await object.populate(field).execPopulate();
    }

    return object[field];
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
}
