import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { ReadonlyUser, ReadonlyUserSchema } from './model';

export class ReadonlyUserMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReadonlyUserSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      _id: mongoose.Types.ObjectId(),
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 20 }),
    };

    return ReadonlyUser.create({ ...defaults, ...params });
  }
}
