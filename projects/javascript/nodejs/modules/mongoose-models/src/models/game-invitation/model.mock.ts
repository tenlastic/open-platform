import * as mongoose from 'mongoose';

import { GameInvitation, GameInvitationSchema } from './model';

export class GameInvitationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameInvitationSchema> = {}) {
    const defaults = {
      namespaceId: mongoose.Types.ObjectId(),
      userId: mongoose.Types.ObjectId(),
    };

    return GameInvitation.create({ ...defaults, ...params });
  }
}
