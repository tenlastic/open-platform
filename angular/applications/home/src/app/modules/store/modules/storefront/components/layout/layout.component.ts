import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  ArticleModel,
  ArticleService,
  ArticleState,
  AuthorizationService,
  AuthorizationState,
  BaseModel,
  BuildModel,
  BuildService,
  GameServerModel,
  GameServerService,
  IArticle,
  IAuthorization,
  QueueMemberModel,
  QueueMemberService,
  QueueModel,
  QueueService,
  StorefrontModel,
  StorefrontService,
  StorefrontState,
  SubscriptionService,
  WebSocketService,
} from '@tenlastic/http';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import {
  BackgroundService,
  ElectronService,
  IdentityService,
  UpdateService,
} from '../../../../../../core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  public IAuthorization = IAuthorization;
  public $guide: Observable<ArticleModel>;
  public $news: Observable<ArticleModel>;
  public $patchNotes: Observable<ArticleModel>;
  public $storefront: Observable<StorefrontModel>;
  public get isElectron() {
    return this.electronService.isElectron;
  }
  public get namespaceId() {
    return this.params?.namespaceId;
  }
  public get status() {
    if (!this.electronService.isElectron || !this.namespaceId) {
      return null;
    }

    return this.updateService.getStatus(this.namespaceId);
  }

  private subscribe$ = new Subscription();
  private params: Params;
  private subscriptions = [
    {
      Model: ArticleModel,
      request: { _id: uuid(), path: '/subscriptions/articles' },
      service: this.articleService,
    },
    {
      Model: BuildModel,
      request: { _id: uuid(), path: '/subscriptions/builds' },
      service: this.buildService,
    },
    {
      Model: GameServerModel,
      request: { _id: uuid(), path: '/subscriptions/game-servers' },
      service: this.gameServerService,
    },
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/subscriptions/queue-members' },
      service: this.queueMemberService,
    },
    {
      Model: QueueModel,
      request: { _id: uuid(), path: '/subscriptions/queues' },
      service: this.queueService,
    },
  ];
  private get webSocket() {
    return this.webSocketService.webSockets.find((ws) => this.webSocketUrl === ws.url);
  }
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleState: ArticleState,
    private articleService: ArticleService,
    private authorizationState: AuthorizationState,
    private authorizationService: AuthorizationService,
    private backgroundService: BackgroundService,
    private buildService: BuildService,
    private electronService: ElectronService,
    private gameServerService: GameServerService,
    private identityService: IdentityService,
    private queueMemberService: QueueMemberService,
    private queueService: QueueService,
    private storefrontState: StorefrontState,
    private storefrontService: StorefrontService,
    private subscriptionService: SubscriptionService,
    private updateService: UpdateService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      if (this.webSocket) {
        this.webSocketService.close(this.webSocket);
      }

      this.params = params;

      const results = await Promise.all([
        this.authorizationService.findUserAuthorizations(
          this.namespaceId,
          this.identityService.user?._id,
        ),
        this.fetchArticles(this.namespaceId),
        this.storefrontService.find(this.namespaceId, {}),
      ]);

      const storefront = results[2][0];

      // Update the background image.
      this.backgroundService.set(storefront.background);

      // Update the Articles.
      this.$guide = this.articleState
        .selectMany()
        .pipe(
          map((as) =>
            as.filter(
              (a) =>
                a.namespaceId === this.namespaceId &&
                a.publishedAt &&
                a.type === IArticle.Type.Guide,
            ),
          ),
        )
        .pipe(map((as) => as.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())))
        .pipe(map((as) => as[0]));
      this.$news = this.articleState
        .selectMany()
        .pipe(
          map((as) =>
            as.filter(
              (a) =>
                a.namespaceId === this.namespaceId &&
                a.publishedAt &&
                a.type === IArticle.Type.News,
            ),
          ),
        )
        .pipe(map((as) => as.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())))
        .pipe(map((as) => as[0]));
      this.$patchNotes = this.articleState
        .selectMany()
        .pipe(
          map((as) =>
            as.filter(
              (a) =>
                a.namespaceId === this.namespaceId &&
                a.publishedAt &&
                a.type === IArticle.Type.PatchNotes,
            ),
          ),
        )
        .pipe(map((as) => as.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())))
        .pipe(map((as) => as[0]));
      this.$storefront = this.storefrontState.selectOne(params.namespaceId);

      // Subscribe to the Namespace.
      await Promise.all([this.webSocketService.connect(this.webSocketUrl), this.subscribe()]);
      this.subscribe$.unsubscribe();
    });
  }

  public ngOnDestroy() {
    this.backgroundService.unset();
    this.subscribe$.unsubscribe();
    this.webSocketService.close(this.webSocket);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }

  private fetchArticles(namespaceId: string) {
    const promises = [
      this.articleService.find(namespaceId, {
        limit: 1,
        sort: '-publishedAt',
        where: { namespaceId, publishedAt: { $exists: true }, type: IArticle.Type.Guide },
      }),
      this.articleService.find(namespaceId, {
        limit: 1,
        sort: '-publishedAt',
        where: { namespaceId, publishedAt: { $exists: true }, type: IArticle.Type.News },
      }),
      this.articleService.find(namespaceId, {
        limit: 1,
        sort: '-publishedAt',
        where: { namespaceId, publishedAt: { $exists: true }, type: IArticle.Type.PatchNotes },
      }),
    ];

    return Promise.all(promises);
  }

  private async subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.subscribe<BaseModel>(
        s.Model,
        { ...s.request },
        s.service,
        this.webSocket,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }
}
