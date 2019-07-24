import * as Chance from 'chance';

import { RefreshToken, RefreshTokenSchema } from './refresh-token.model';

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
    };

    return RefreshToken.create({ ...defaults, ...params });
  }
}
