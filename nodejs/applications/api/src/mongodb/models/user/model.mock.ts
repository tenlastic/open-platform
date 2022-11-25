import * as Chance from 'chance';

import { User, UserSchema } from './model';

export class UserMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<UserSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 24 }),
    };

    return User.create({ ...defaults, ...params });
  }
}
