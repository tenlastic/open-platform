import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionQuery,
  CollectionService,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  RecordModel,
  RecordService,
  RecordStore,
  SubscriptionService,
  TokenService,
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
  public $collection: Observable<CollectionModel>;
  public get $hasRelated() {
    const roles = [...IAuthorization.collectionRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/collections/${this.params.collectionId}`) ||
      this.router.url.endsWith(`/collections/${this.params.collectionId}/json`)
    );
  }

  private params: Params;
  private subscriptions = [
    {
      Model: RecordModel,
      request: { _id: uuid() } as WebSocketRequest,
      service: this.recordService,
      store: this.recordStore,
    },
  ];
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private recordService: RecordService,
    private recordStore: RecordStore,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private tokenService: TokenService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$namespace = this.namespaceQuery.selectEntity(params.namespaceId);

      if (params.collectionId === 'new') {
        return;
      }

      this.$collection = this.collectionQuery.selectEntity(params.collectionId);
      await this.collectionService.findOne(params.namespaceId, params.collectionId);

      const accessToken = await this.tokenService.getAccessToken();
      return Promise.all([
        this.webSocketService.connect(accessToken, this.webSocketUrl),
        this.subscribe(),
      ]);
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
    const promises = this.subscriptions.map((s) => {
      const path = `/subscriptions/collections/${this.params.collectionId}/records`;

      return this.subscriptionService.subscribe(
        s.Model,
        { ...s.request, path },
        s.service,
        s.store,
        this.webSocketUrl,
      );
    });

    return Promise.all(promises);
  }

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocketUrl),
    );

    return Promise.all(promises);
  }
}
