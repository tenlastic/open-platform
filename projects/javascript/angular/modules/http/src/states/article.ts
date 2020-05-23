import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Article } from '../models/article';
import { ArticleService } from '../services/article/article.service';

export interface ArticleState extends EntityState<Article> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'articles' })
export class ArticleStore extends EntityStore<ArticleState, Article> {
  constructor(private articleService: ArticleService) {
    super();

    this.articleService.onCreate.subscribe(record => this.add(record));
    this.articleService.onDelete.subscribe(record => this.remove(record._id));
    this.articleService.onRead.subscribe(records => this.upsertMany(records));
    this.articleService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class ArticleQuery extends QueryEntity<ArticleState, Article> {
  constructor(protected store: ArticleStore) {
    super(store);
  }
}
