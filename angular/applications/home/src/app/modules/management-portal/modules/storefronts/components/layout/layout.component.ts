import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  ArticleModel,
  ArticleService,
  ArticleStore,
  AuthorizationQuery,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
  SubscriptionService,
  WebSocketRequest,
  WebSocketService,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { environment } from '../../../../../../../environments/environment';
import { IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnDestroy, OnInit {
  public $namespace: Observable<NamespaceModel>;
  public $storefront: Observable<StorefrontModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return this.router.url.endsWith(`/storefront`) || this.router.url.endsWith(`/storefront/json`);
  }

  private params: Params;
  private subscriptions = [
    {
      Model: ArticleModel,
      request: { _id: uuid(), path: '/subscriptions/articles' } as WebSocketRequest,
      service: this.articleService,
      store: this.articleStore,
    },
  ];
  private get webSocket() {
    const url = `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
    return this.webSocketService.webSockets.find((ws) => url === ws.url);
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private articleService: ArticleService,
    private articleStore: ArticleStore,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private router: Router,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private subscriptionService: SubscriptionService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$namespace = this.namespaceQuery.selectEntity(params.namespaceId);
      this.$storefront = this.storefrontQuery.selectEntity(params.namespaceId);

      await this.storefrontService.find(params.namespaceId, { limit: 1 });

      return this.subscribe();
    });
  }

  public async ngOnDestroy() {
    await this.unsubscribe();
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }

  private async subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.subscribe(
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

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocket),
    );

    return Promise.all(promises);
  }
}
