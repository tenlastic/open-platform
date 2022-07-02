import { Mongodb, MongodbSchema } from './model';

export class MongodbMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<MongodbSchema> = {}) {
    const defaults = {};

    return new Mongodb({ ...defaults, ...params });
  }
}
