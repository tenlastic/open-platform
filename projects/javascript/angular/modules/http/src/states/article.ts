import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Article } from '../models/article';
import { ArticleService } from '../services/article/article.service';
import { GameQuery } from './game';
import { NamespaceQuery } from './namespace';

export interface ArticleState extends EntityState<Article> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'articles', resettable: true })
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
  constructor(
    protected gameQuery: GameQuery,
    protected namespaceQuery: NamespaceQuery,
    protected store: ArticleStore,
  ) {
    super(store);
  }

  public populate($input: Observable<Article[]>) {
    return combineLatest([
      $input,
      this.gameQuery.selectAll({ asObject: true }),
      this.namespaceQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([articles, games, namespaces]) => {
        return articles.map(article => {
          return new Article({
            ...article,
            game: games[article.gameId],
            namespace: namespaces[article.namespaceId],
          });
        });
      }),
    );
  }
}
