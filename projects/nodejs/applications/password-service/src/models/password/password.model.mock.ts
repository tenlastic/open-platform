import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Password, PasswordSchema } from './password.model';

export class PasswordMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<PasswordSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      hash: chance.hash(),
      userId: new mongoose.Types.ObjectId(),
    };

    return Password.create({ ...defaults, ...params });
  }
}
