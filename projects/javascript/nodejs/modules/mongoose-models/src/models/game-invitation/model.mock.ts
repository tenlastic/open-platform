import * as mongoose from 'mongoose';

import { GameInvitation, GameInvitationSchema } from './model';

export class GameInvitationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GameInvitationSchema> = {}) {
    const defaults = {
      fromUserId: mongoose.Types.ObjectId(),
      gameId: mongoose.Types.ObjectId(),
      toUserId: mongoose.Types.ObjectId(),
    };

    return GameInvitation.create({ ...defaults, ...params });
  }
}
