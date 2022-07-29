import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  Article,
  ArticleQuery,
  ArticleService,
  Storefront,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/ng-http';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { ElectronService, UpdateService } from '../../../../core/services';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public get $activeStorefront() {
    return this.storefrontQuery.selectActive() as Observable<Storefront>;
  }
  public $guides: Observable<Article[]>;
  public $news: Observable<Article[]>;
  public $patchNotes: Observable<Article[]>;
  public $storefronts: Observable<Storefront[]>;
  public get $showStatusComponent() {
    return this.$activeStorefront.pipe(
      map((storefront) => {
        if (!this.electronService.isElectron || !storefront) {
          return null;
        }

        const status = this.updateService.getStatus(storefront._id);
        return status ? storefront : null;
      }),
    );
  }
  public get isElectron() {
    return this.electronService.isElectron;
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
    private electronService: ElectronService,
    private storefrontService: StorefrontService,
    private storefrontQuery: StorefrontQuery,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.$storefronts = this.storefrontQuery.selectAll({ sortBy: 'title' });
    this.setBackground$ = this.$activeStorefront.subscribe((activeStorefront) => {
      const value = activeStorefront?.background || '/assets/images/background.jpg';
      this.document.body.style.backgroundImage = `url('${value}')`;
    });
    this.updateArticles$ = this.$activeStorefront.subscribe((storefront) => {
      if (!storefront) {
        return;
      }

      this.$guides = this.articleQuery.selectAll({
        filterBy: (a) =>
          a.namespaceId === storefront.namespaceId && a.publishedAt && a.type === 'Guide',
      });
      this.$news = this.articleQuery.selectAll({
        filterBy: (a) =>
          a.namespaceId === storefront.namespaceId && a.publishedAt && a.type === 'News',
      });
      this.$patchNotes = this.articleQuery.selectAll({
        filterBy: (a) =>
          a.namespaceId === storefront.namespaceId && a.publishedAt && a.type === 'Patch Notes',
      });

      return this.fetchArticles(storefront.namespaceId);
    });

    await this.storefrontService.find({ sort: 'title' });

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

  private fetchArticles(namespaceId: string) {
    const promises = [
      this.articleService.find({
        limit: 1,
        where: {
          namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'News',
        },
      }),
      this.articleService.find({
        limit: 1,
        where: {
          namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'Patch Notes',
        },
      }),
    ];

    return Promise.all(promises);
  }
}
