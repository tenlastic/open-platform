import { Component, OnInit } from '@angular/core';
import {
  ArticleModel,
  ArticleService,
  ArticleState,
  IArticle,
  IAuthorization,
  StorefrontModel,
} from '@tenlastic/http';
import { map, Observable } from 'rxjs';

import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  public IAuthorization = IAuthorization;
  public $articles: Observable<ArticleModel[]>;
  public $storefront: Observable<StorefrontModel>;
  public namespaceId: string;

  private type: IArticle.Type;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleState: ArticleState,
    private articleService: ArticleService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.data.subscribe((data) => (this.type = data.type));
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.$articles = this.articleState
        .selectMany()
        .pipe(
          map((as) =>
            as.filter(
              (a) => a.namespaceId === this.namespaceId && a.publishedAt && a.type === this.type,
            ),
          ),
        )
        .pipe(map((as) => as.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())));

      await this.fetchArticles(this.namespaceId);
    });
  }

  public showYear(article: ArticleModel) {
    return article.publishedAt.getFullYear() !== new Date().getFullYear();
  }

  private fetchArticles(namespaceId: string) {
    return this.articleService.find(namespaceId, {
      sort: '-publishedAt',
      where: { namespaceId, publishedAt: { $exists: true }, type: this.type },
    });
  }
}
