import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  ArticleModel,
  ArticleQuery,
  ArticleService,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  StorefrontService,
} from '@tenlastic/ng-http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ElectronService, IdentityService, UpdateService } from '../../../../../../core/services';
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public IAuthorization = IAuthorization;
  public $guides: Observable<ArticleModel[]>;
  public $news: Observable<ArticleModel[]>;
  public $patchNotes: Observable<ArticleModel[]>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get namespaceId() {
    return this.params.namespaceId;
  }
  public get status() {
    if (!this.electronService.isElectron || !this.namespaceId) {
      return null;
    }

    return this.updateService.getStatus(this.namespaceId);
  }

  private params: Params;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private electronService: ElectronService,
    private identityService: IdentityService,
    private storefrontService: StorefrontService,
    private updateService: UpdateService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      const results = await Promise.all([
        this.authorizationService.findUserAuthorizations(
          this.namespaceId,
          this.identityService.user?._id,
        ),
        this.fetchArticles(this.namespaceId),
        this.storefrontService.find(this.namespaceId, {
          limit: 1,
          where: { namespaceId: this.namespaceId },
        }),
      ]);

      const storefront = results[2][0];

      // Update the background image.
      const value = storefront.background || '/assets/images/background.jpg';
      this.document.body.style.backgroundImage = `url('${value}')`;

      // Update the Articles.
      this.$guides = this.articleQuery.selectAll({
        filterBy: (a) => a.namespaceId === this.namespaceId && a.publishedAt && a.type === 'Guide',
      });
      this.$news = this.articleQuery.selectAll({
        filterBy: (a) => a.namespaceId === this.namespaceId && a.publishedAt && a.type === 'News',
      });
      this.$patchNotes = this.articleQuery.selectAll({
        filterBy: (a) =>
          a.namespaceId === this.namespaceId && a.publishedAt && a.type === 'Patch Notes',
      });
    });
  }

  public ngOnDestroy() {
    this.document.body.style.backgroundImage = `url('/assets/images/background.jpg')`;
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }

  private fetchArticles(namespaceId: string) {
    const promises = [
      this.articleService.find(namespaceId, {
        limit: 1,
        where: {
          namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'Guide',
        },
      }),
      this.articleService.find(namespaceId, {
        limit: 1,
        where: {
          namespaceId,
          publishedAt: { $exists: true, $ne: null },
          type: 'News',
        },
      }),
      this.articleService.find(namespaceId, {
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
