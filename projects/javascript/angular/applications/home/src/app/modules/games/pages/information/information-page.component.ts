import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { Article, ArticleService, Game, GameService, GameStore } from '@tenlastic/ng-http';

import { BackgroundService, IdentityService } from '../../../../core/services';
import { ArticleDialogComponent, StatusComponent } from '../../components';

@Component({
  styleUrls: ['./information-page.component.scss'],
  templateUrl: 'information-page.component.html',
})
export class InformationPageComponent implements OnInit {
  @ViewChild(StatusComponent, { static: false }) private statusComponent: StatusComponent;
  @ViewChild('video', { static: false }) private video: ElementRef;

  public articles: Article[];
  public articlesByDate: Article[][];
  public game: Game;
  public error: string;
  public loadingMessage: string;
  public mainMedia: { src: string; type: 'image' | 'video' };
  public get timestamp() {
    return new Date().getTime();
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private backgroundService: BackgroundService,
    public identityService: IdentityService,
    private gameService: GameService,
    private gameStore: GameStore,
    private matDialog: MatDialog,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.subscribe(async params => {
      this.loadingMessage = 'Loading Game...';

      const slug = params.get('slug');
      if (!slug) {
        const previousGameSlug = localStorage.getItem('previousGameSlug');
        if (previousGameSlug) {
          this.router.navigate([previousGameSlug], { relativeTo: this.activatedRoute });
        }

        return;
      }

      this.game = await this.gameService.findOne(slug);
      this.gameStore.setActive(this.game._id);

      if (this.game.images.length > 0) {
        this.selectMedia(0, 'image');
      } else {
        this.selectMedia(0, 'video');
      }

      this.articles = await this.articleService.find({
        sort: '-publishedAt',
        where: {
          $and: [{ publishedAt: { $exists: true } }, { publishedAt: { $ne: null } }],
          gameId: this.game._id,
        },
      });
      this.articlesByDate = this.groupByDate(this.articles);

      this.backgroundService.subject.next(this.game.background || '/assets/images/background.jpg');

      if (this.statusComponent) {
        this.statusComponent.game = this.game;
        this.statusComponent.ngOnInit();
      }

      localStorage.setItem('previousGameSlug', slug);

      this.loadingMessage = null;
    });
  }

  public nextMedia(value: number, type: 'image' | 'video' = 'image') {
    let index = this.game.images.indexOf(this.mainMedia.src) + value;

    if (index < 0) {
      index = this.game.images.length - 1;
    }
    if (index >= this.game.images.length) {
      index = 0;
    }

    this.selectMedia(index);
  }

  public selectMedia(index: number, type: 'image' | 'video' = 'image') {
    this.mainMedia = {
      src: type === 'image' ? this.game.images[index] : this.game.videos[index],
      type,
    };

    if (type === 'video' && this.video) {
      this.video.nativeElement.load();
      this.video.nativeElement.muted = false;
    }
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
      Array.from(articles, obj => [obj.publishedAt.toLocaleDateString(), []]),
    );
    articles.forEach(obj => map.get(obj.publishedAt.toLocaleDateString()).push(obj));

    return Array.from(map.values());
  }
}
