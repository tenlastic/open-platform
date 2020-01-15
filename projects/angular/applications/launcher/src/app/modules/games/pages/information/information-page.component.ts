import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import { Article, ArticleService, Game, GameService } from '@tenlastic/ng-http';

import { ArticleDialogComponent } from '../../components';

@Component({
  styleUrls: ['./information-page.component.scss'],
  templateUrl: 'information-page.component.html',
})
export class InformationPageComponent implements OnInit {
  public articles: Article[];
  public articlesByDate: Article[][];
  public data: Game;
  public error: string;
  public loadingMessage: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    public electronService: ElectronService,
    public identityService: IdentityService,
    private gameService: GameService,
    private matDialog: MatDialog,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.loadingMessage = 'Loading Game...';

      const slug = params.get('slug');
      if (slug) {
        this.data = await this.gameService.findOne(slug);

        this.articles = await this.articleService.find(slug, {
          sort: '-publishedAt',
          where: { $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }] },
        });
        this.articlesByDate = this.groupByDate(this.articles);

        this.loadingMessage = null;
      }
    });
  }

  public showArticle(article: Article) {
    this.matDialog.open(ArticleDialogComponent, {
      autoFocus: false,
      data: { article },
      width: '1000000px',
    });
  }

  private groupByDate(articles: Article[]) {
    const map = new Map<any, any>(
      Array.from(articles, obj => [this.toDateString(obj.publishedAt), []]),
    );
    articles.forEach(obj => map.get(this.toDateString(obj.publishedAt)).push(obj));

    return Array.from(map.values());
  }

  private toDateString(date: Date) {
    return date
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
  }
}
