import * as mongoose from 'mongoose';

import { UserRoles, UserRolesSchema } from './model';

export class UserRolesMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<UserRolesSchema> = {}) {
    const defaults = {
      userId: mongoose.Types.ObjectId(),
    };

    return new UserRoles({ ...defaults, ...params });
  }
}
