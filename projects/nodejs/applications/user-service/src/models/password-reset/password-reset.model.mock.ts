import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { PasswordReset, PasswordResetSchema } from './password-reset.model';

const chance = new Chance();

export class PasswordResetMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<PasswordResetSchema> = {}) {
    const defaults = {
      hash: chance.hash({ length: 128 }),
      userId: new mongoose.Types.ObjectId(),
    };

    return PasswordReset.create({ ...defaults, ...params });
  }
}
