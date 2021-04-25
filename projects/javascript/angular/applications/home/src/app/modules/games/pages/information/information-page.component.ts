import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Article, ArticleService, Game, GameService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../core/services';

@Component({
  styleUrls: ['./information-page.component.scss'],
  templateUrl: 'information-page.component.html',
})
export class InformationPageComponent implements OnInit {
  @ViewChild('video') private video: ElementRef;

  public articles: Article[];
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
    public identityService: IdentityService,
    private gameService: GameService,
  ) {}

  public async ngOnInit() {
    this.loadingMessage = 'Loading Game information...';

    const _id = this.activatedRoute.snapshot.paramMap.get('_id');
    this.game = await this.gameService.findOne(_id);

    if (this.game.videos.length > 0) {
      this.selectMedia(0, 'video', true);
    } else {
      this.selectMedia(0, 'image', true);
    }

    this.articles = await this.articleService.find({
      sort: '-publishedAt',
      where: {
        namespaceId: this.game.namespaceId,
        publishedAt: { $exists: true, $ne: null },
      },
    });

    this.loadingMessage = null;
  }

  public async selectMedia(index: number, type: 'image' | 'video' = 'image', muted = false) {
    this.mainMedia = {
      src: type === 'image' ? this.game.images[index] : this.game.videos[index],
      type,
    };

    if (type === 'video' && this.video) {
      this.video.nativeElement.load();
      this.video.nativeElement.muted = muted;
      this.video.nativeElement.setAttribute('onloadedmetadata', `this.muted=${muted}`);
    }
  }
}
