import { Component, OnInit } from '@angular/core';
import { Article, ArticleService, Storefront, StorefrontQuery } from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./news-page.component.scss'],
  templateUrl: 'news-page.component.html',
})
export class NewsPageComponent implements OnInit {
  public articles: Article[];
  public loadingMessage: string;

  constructor(private articleService: ArticleService, private storefrontQuery: StorefrontQuery) {}

  public async ngOnInit() {
    this.loadingMessage = 'Loading Articles...';

    const storefront = this.storefrontQuery.getActive() as Storefront;
    this.articles = await this.articleService.find({
      sort: '-publishedAt',
      where: {
        namespaceId: storefront.namespaceId,
        publishedAt: { $exists: true, $ne: null },
        type: 'News',
      },
    });

    this.loadingMessage = null;
  }
}
