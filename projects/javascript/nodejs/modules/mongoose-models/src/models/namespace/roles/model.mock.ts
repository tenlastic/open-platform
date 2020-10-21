import * as mongoose from 'mongoose';

import { NamespaceRoles, NamespaceRolesSchema } from './model';

export class NamespaceRolesMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceRolesSchema> = {}) {
    const defaults = {
      userId: mongoose.Types.ObjectId(),
    };

    return new NamespaceRoles({ ...defaults, ...params });
  }
}
