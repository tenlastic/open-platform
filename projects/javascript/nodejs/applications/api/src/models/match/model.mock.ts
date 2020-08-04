import * as mongoose from 'mongoose';

import { Match, MatchSchema } from './model';

export class MatchMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<MatchSchema> = {}) {
    const defaults = {
      queueId: mongoose.Types.ObjectId(),
    };

    return Match.create({ ...defaults, ...params });
  }
}
