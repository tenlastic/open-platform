import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Article, ArticleService } from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./news-page.component.scss'],
  templateUrl: 'news-page.component.html',
})
export class NewsPageComponent implements OnInit {
  public articles: Article[];
  public loadingMessage: string;

  constructor(private activatedRoute: ActivatedRoute, private articleService: ArticleService) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Articles...';

      this.articles = await this.articleService.find({
        sort: '-publishedAt',
        where: {
          namespaceId: params.namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'News',
        },
      });

      this.loadingMessage = null;
    });
  }
}
