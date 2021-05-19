import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { ArticleModel } from '../models/article';
import { articleService } from '../services/article';

export interface ArticleState extends EntityState<ArticleModel> {}

@StoreConfig({ idKey: '_id', name: 'articles', resettable: true })
export class ArticleStore extends EntityStore<ArticleState, ArticleModel> {
  constructor() {
    super();

    articleService.emitter.on('create', record => this.add(record));
    articleService.emitter.on('delete', _id => this.remove(_id));
    articleService.emitter.on('set', records => this.upsertMany(records));
    articleService.emitter.on('update', record => this.upsert(record._id, record));
  }
}

export class ArticleQuery extends QueryEntity<ArticleState, ArticleModel> {
  constructor(protected store: ArticleStore) {
    super(store);
  }
}

export const articleStore = new ArticleStore();
export const articleQuery = new ArticleQuery(articleStore);
