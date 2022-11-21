import * as mongoose from 'mongoose';
import { AuthorizationRequest, AuthorizationRequestSchema } from './model';

export class AuthorizationRequestMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<AuthorizationRequestSchema> = {}) {
    const defaults = { userId: new mongoose.Types.ObjectId() };

    return AuthorizationRequest.create({ ...defaults, ...params });
  }
}
