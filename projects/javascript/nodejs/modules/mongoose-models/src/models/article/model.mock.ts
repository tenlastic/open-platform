import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { GameMock } from '../game';
import { Article, ArticleSchema } from './model';

export class ArticleMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ArticleSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      gameId: mongoose.Types.ObjectId(),
      namespaceId: mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    if (!params.gameId) {
      const game = await GameMock.create({
        namespaceId: params.namespaceId ?? defaults.namespaceId,
      });
      defaults.gameId = game._id;
    }

    return Article.create({ ...defaults, ...params });
  }
}
