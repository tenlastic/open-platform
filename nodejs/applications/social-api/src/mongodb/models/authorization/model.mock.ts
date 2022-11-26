import { Authorization, AuthorizationSchema } from './model';

export class AuthorizationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<AuthorizationSchema> = {}) {
    const defaults = {};

    return Authorization.create({ ...defaults, ...params });
  }
}
