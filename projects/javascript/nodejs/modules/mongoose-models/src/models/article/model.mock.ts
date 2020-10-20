import * as Chance from 'chance';
import * as mongoose from 'mongoose';

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
      namespaceId: mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    return Article.create({ ...defaults, ...params });
  }
}
