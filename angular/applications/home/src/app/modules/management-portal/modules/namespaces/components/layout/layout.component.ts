import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationService,
  BaseModel,
  BuildModel,
  BuildService,
  BuildStore,
  CollectionModel,
  CollectionService,
  CollectionStore,
  GameServerModel,
  GameServerService,
  GameServerStore,
  GameServerTemplateModel,
  GameServerTemplateService,
  GameServerTemplateStore,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  QueueModel,
  QueueService,
  QueueStore,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
  SubscriptionService,
  TokenService,
  WebSocketRequest,
  WebSocketService,
  WorkflowModel,
  WorkflowService,
  WorkflowStore,
} from '@tenlastic/http';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public get $hasRelated() {
    const roles = [
      ...IAuthorization.articleRoles,
      ...IAuthorization.buildRoles,
      ...IAuthorization.collectionRoles,
      ...IAuthorization.gameServerRoles,
      ...IAuthorization.queueRoles,
      ...IAuthorization.storefrontRoles,
      ...IAuthorization.workflowRoles,
    ];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public $storefront: Observable<StorefrontModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/namespaces/${this.params.namespaceId}`) ||
      this.router.url.endsWith(`/namespaces/${this.params.namespaceId}/json`)
    );
  }

  private fetchStorefront$ = new Subscription();
  private subscribe$ = new Subscription();
  private connected = false;
  private params: Params;
  private subscriptions = [
    {
      Model: BuildModel,
      request: { _id: uuid(), path: '/subscriptions/builds' } as WebSocketRequest,
      service: this.buildService,
      store: this.buildStore,
    },
    {
      Model: CollectionModel,
      request: { _id: uuid(), path: '/subscriptions/collections' } as WebSocketRequest,
      service: this.collectionService,
      store: this.collectionStore,
    },
    {
      Model: GameServerModel,
      request: { _id: uuid(), path: '/subscriptions/game-servers' } as WebSocketRequest,
      service: this.gameServerService,
      store: this.gameServerStore,
    },
    {
      Model: GameServerTemplateModel,
      request: { _id: uuid(), path: '/subscriptions/game-server-templates' } as WebSocketRequest,
      service: this.gameServerTemplateService,
      store: this.gameServerTemplateStore,
    },
    {
      Model: QueueModel,
      request: { _id: uuid(), path: '/subscriptions/queues' } as WebSocketRequest,
      service: this.queueService,
      store: this.queueStore,
    },
    {
      Model: WorkflowModel,
      request: { _id: uuid(), path: '/subscriptions/workflows' } as WebSocketRequest,
      service: this.workflowService,
      store: this.workflowStore,
    },
  ];
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private buildService: BuildService,
    private buildStore: BuildStore,
    private collectionService: CollectionService,
    private collectionStore: CollectionStore,
    private gameServerService: GameServerService,
    private gameServerStore: GameServerStore,
    private gameServerTemplateService: GameServerTemplateService,
    private gameServerTemplateStore: GameServerTemplateStore,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private queueService: QueueService,
    private queueStore: QueueStore,
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private subscriptionService: SubscriptionService,
    private tokenService: TokenService,
    private webSocketService: WebSocketService,
    private workflowService: WorkflowService,
    private workflowStore: WorkflowStore,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.namespaceId === 'new') {
        return;
      }

      this.$namespace = this.namespaceQuery.selectEntity(params.namespaceId);
      this.$storefront = this.storefrontQuery.selectEntity(params.namespaceId);

      this.fetchStorefront$ = this.$namespace.subscribe(async (namespace) => {
        if (namespace?.status.phase === 'Running') {
          return this.storefrontService.find(params.namespaceId, { limit: 1 });
        }
      });
      this.subscribe$ = this.$namespace.subscribe((namespace) => {
        if (namespace.status?.phase === 'Running') {
          this.connectSocket();
        }
      });

      await Promise.all([
        this.authorizationService.findUserAuthorizations(params.namespaceId, null),
        this.namespaceService.findOne(params.namespaceId),
      ]);
    });
  }

  public ngOnDestroy() {
    this.fetchStorefront$.unsubscribe();
    this.subscribe$.unsubscribe();
    this.webSocketService.close(this.webSocketUrl);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }

  private async connectSocket() {
    const webSocket = this.webSocketService.webSockets.get(this.webSocketUrl);
    if (webSocket) {
      return;
    }

    const accessToken = await this.tokenService.getAccessToken();
    if (!accessToken) {
      return;
    }

    return Promise.all([
      this.webSocketService.connect(accessToken, this.webSocketUrl),
      this.subscribe(),
    ]);
  }

  private async subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.subscribe<BaseModel>(
        s.Model,
        { ...s.request },
        s.service,
        s.store,
        this.webSocketUrl,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }
}
