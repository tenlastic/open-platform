import { Component, OnInit } from '@angular/core';
import {
  ArticleModel,
  ArticleQuery,
  ArticleService,
  IArticle,
  IAuthorization,
  StorefrontModel,
} from '@tenlastic/http';
import { Observable } from 'rxjs';

import { ActivatedRoute, Params } from '@angular/router';
import { Order } from '@datorama/akita';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public IAuthorization = IAuthorization;
  public $articles: Observable<ArticleModel[]>;
  public $storefront: Observable<StorefrontModel>;
  public get namespaceId() {
    return this.params.namespaceId;
  }

  private params: Params;
  private type: IArticle.Type;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$articles = this.articleQuery.selectAll({
        filterBy: (a) =>
          a.namespaceId === this.namespaceId && a.publishedAt && a.type === this.type,
        sortBy: 'publishedAt',
        sortByOrder: Order.DESC,
      });

      await this.fetchArticles(this.namespaceId);
    });
  }

  public showYear(article: ArticleModel) {
    return article.publishedAt.getFullYear() !== new Date().getFullYear();
  }

  private fetchArticles(namespaceId: string) {
    return this.articleService.find(namespaceId, {
      sort: '-publishedAt',
      where: { namespaceId, publishedAt: { $exists: true, $ne: null }, type: this.type },
    });
  }
}
