import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleModel, ArticleService } from '@tenlastic/http';

@Component({
  styleUrls: ['./guides-page.component.scss'],
  templateUrl: 'guides-page.component.html',
})
export class GuidesPageComponent implements OnInit {
  public articles: ArticleModel[];
  public loadingMessage: string;

  constructor(private activatedRoute: ActivatedRoute, private articleService: ArticleService) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.loadingMessage = 'Loading Articles...';

      this.articles = await this.articleService.find(params.namespaceId, {
        sort: '-publishedAt',
        where: {
          namespaceId: params.namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'Guide',
        },
      });

      this.loadingMessage = null;
    });
  }
}