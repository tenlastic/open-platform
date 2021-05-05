import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Article,
  ArticleQuery,
  ArticleService,
  Game,
  GameQuery,
  GameService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ElectronService, IdentityService, UpdateService } from '../../../../core/services';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public get $activeGame() {
    return this.gameQuery.selectActive() as Observable<Game>;
  }
  public $news: Observable<Article[]>;
  public $patchNotes: Observable<Article[]>;
  public get $showStatusComponent() {
    return this.$activeGame.pipe(
      map(game => {
        if (!this.electronService.isElectron || !game) {
          return null;
        }

        const status = this.updateService.getStatus(game._id);
        return status ? game : null;
      }),
    );
  }
  public launcherUrl = environment.launcherUrl;
  public message: string;
  public showSidenav = false;

  private setBackground$ = new Subscription();
  private updateArticles$ = new Subscription();

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    private changeDetectorRef: ChangeDetectorRef,
    public electronService: ElectronService,
    private gameService: GameService,
    private gameQuery: GameQuery,
    public router: Router,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.setBackground$ = this.$activeGame.subscribe(activeGame => {
      const value = activeGame?.background || '/assets/images/background.jpg';
      this.document.body.style.backgroundImage = `url('${value}')`;
    });
    this.updateArticles$ = this.$activeGame.subscribe(game => {
      if (!game) {
        return;
      }

      this.$news = this.articleQuery.selectAll({
        filterBy: a => a.gameId === game._id && a.publishedAt && a.type === 'News',
      });
      this.$patchNotes = this.articleQuery.selectAll({
        filterBy: a => a.gameId === game._id && a.publishedAt && a.type === 'Patch Notes',
      });
      return this.fetchArticles(game._id);
    });

    await this.gameService.find({});

    if (!this.electronService.isElectron) {
      return;
    }

    const { ipcRenderer } = this.electronService;
    ipcRenderer.on('message', (event, text) => {
      if (text.includes('Update available')) {
        this.message = 'Downloading update...';
      }

      if (text.includes('Update downloaded')) {
        this.message = 'Restart to install update.';
      }

      this.changeDetectorRef.detectChanges();
    });
  }

  public ngOnDestroy() {
    this.setBackground$.unsubscribe();
    this.updateArticles$.unsubscribe();

    this.document.body.style.backgroundImage = `url('/assets/images/background.jpg')`;
  }

  private fetchArticles(gameId: string) {
    const promises = [
      this.articleService.find({
        limit: 1,
        where: {
          gameId,
          publishedAt: { $exists: true, $ne: null },
          type: 'News',
        },
      }),
      this.articleService.find({
        limit: 1,
        where: {
          gameId,
          publishedAt: { $exists: true, $ne: null },
          type: 'Patch Notes',
        },
      }),
    ];

    return Promise.all(promises);
  }
}
