import { Component, OnInit } from '@angular/core';
import { Article, ArticleService, Game, GameQuery } from '@tenlastic/ng-http';

@Component({
  styleUrls: ['./patch-notes-page.component.scss'],
  templateUrl: 'patch-notes-page.component.html',
})
export class PatchNotesPageComponent implements OnInit {
  public articles: Article[];
  public loadingMessage: string;

  constructor(private articleService: ArticleService, private gameQuery: GameQuery) {}

  public async ngOnInit() {
    this.loadingMessage = 'Loading Articles...';

    const game = this.gameQuery.getActive() as Game;
    this.articles = await this.articleService.find({
      sort: '-publishedAt',
      where: {
        namespaceId: game.namespaceId,
        publishedAt: { $exists: true, $ne: null },
        type: 'Patch Notes',
      },
    });

    this.loadingMessage = null;
  }
}
