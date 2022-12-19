import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { ArticleModel } from '../models/article';
import { BaseStore } from './base';

export interface ArticleState extends EntityState<ArticleModel> {}

@StoreConfig({ idKey: '_id', name: 'articles', resettable: true })
export class ArticleStore extends BaseStore<ArticleState, ArticleModel> {}

export class ArticleQuery extends QueryEntity<ArticleState, ArticleModel> {
  constructor(protected store: ArticleStore) {
    super(store);
  }
}
