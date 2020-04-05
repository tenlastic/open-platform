import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { ReadonlyGame, ReadonlyGameSchema } from './model';

export class ReadonlyGameMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReadonlyGameSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      namespaceId: mongoose.Types.ObjectId(),
      slug: chance.hash(),
      title: chance.hash(),
    };

    return ReadonlyGame.create({ ...defaults, ...params });
  }
}
