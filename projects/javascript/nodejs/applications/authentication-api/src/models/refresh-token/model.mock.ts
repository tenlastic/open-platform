import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { RefreshToken, RefreshTokenSchema } from './model';

const chance = new Chance();

export class RefreshTokenMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<RefreshTokenSchema> = {}) {
    const defaults = {
      expiresAt: new Date(),
      jti: chance.hash(),
      userId: new mongoose.Types.ObjectId(),
    };

    return RefreshToken.create({ ...defaults, ...params });
  }
}
