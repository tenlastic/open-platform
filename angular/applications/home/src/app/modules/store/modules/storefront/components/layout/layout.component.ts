import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Order } from '@datorama/akita';
import {
  ArticleModel,
  ArticleQuery,
  ArticleService,
  ArticleStore,
  AuthorizationQuery,
  AuthorizationService,
  BaseModel,
  BuildModel,
  BuildService,
  BuildStore,
  GameServerModel,
  GameServerService,
  GameServerStore,
  IArticle,
  IAuthorization,
  QueueMemberModel,
  QueueMemberService,
  QueueMemberStore,
  QueueModel,
  QueueService,
  QueueStore,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
  SubscriptionService,
  WebSocketRequest,
  WebSocketService,
} from '@tenlastic/http';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import {
  BackgroundService,
  ElectronService,
  IdentityService,
  UpdateService,
} from '../../../../../../core/services';
import { environment } from '../../../../../../../environments/environment';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
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
      request: { _id: uuid(), path: '/subscriptions/articles' } as WebSocketRequest,
      service: this.articleService,
      store: this.articleStore,
    },
    {
      Model: BuildModel,
      request: { _id: uuid(), path: '/subscriptions/builds' } as WebSocketRequest,
      service: this.buildService,
      store: this.buildStore,
    },
    {
      Model: GameServerModel,
      request: { _id: uuid(), path: '/subscriptions/game-servers' } as WebSocketRequest,
      service: this.gameServerService,
      store: this.gameServerStore,
    },
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/subscriptions/queue-members' } as WebSocketRequest,
      service: this.queueMemberService,
      store: this.queueMemberStore,
    },
    {
      Model: QueueModel,
      request: { _id: uuid(), path: '/subscriptions/queues' } as WebSocketRequest,
      service: this.queueService,
      store: this.queueStore,
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
    private articleQuery: ArticleQuery,
    private articleService: ArticleService,
    private articleStore: ArticleStore,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private backgroundService: BackgroundService,
    private buildService: BuildService,
    private buildStore: BuildStore,
    private electronService: ElectronService,
    private gameServerService: GameServerService,
    private gameServerStore: GameServerStore,
    private identityService: IdentityService,
    private queueMemberService: QueueMemberService,
    private queueMemberStore: QueueMemberStore,
    private queueService: QueueService,
    private queueStore: QueueStore,
    private storefrontQuery: StorefrontQuery,
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
      this.$guide = this.articleQuery
        .selectAll({
          filterBy: (a) =>
            a.namespaceId === this.namespaceId && a.publishedAt && a.type === IArticle.Type.Guide,
          sortBy: 'publishedAt',
          sortByOrder: Order.DESC,
        })
        .pipe(map((a) => a[0]));
      this.$news = this.articleQuery
        .selectAll({
          filterBy: (a) =>
            a.namespaceId === this.namespaceId && a.publishedAt && a.type === IArticle.Type.News,
          sortBy: 'publishedAt',
          sortByOrder: Order.DESC,
        })
        .pipe(map((a) => a[0]));
      this.$patchNotes = this.articleQuery
        .selectAll({
          filterBy: (a) =>
            a.namespaceId === this.namespaceId &&
            a.publishedAt &&
            a.type === IArticle.Type.PatchNotes,
          sortBy: 'publishedAt',
          sortByOrder: Order.DESC,
        })
        .pipe(map((a) => a[0]));
      this.$storefront = this.storefrontQuery.selectEntity(params.namespaceId);

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
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
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
        s.store,
        this.webSocket,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }
}
