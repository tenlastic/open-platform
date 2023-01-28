import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  QueueMemberModel,
  QueueMemberService,
  QueueMemberStore,
  QueueModel,
  QueueQuery,
  QueueService,
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
  public get $hasRelated() {
    const roles = [...IAuthorization.gameServerRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public $queue: Observable<QueueModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/queues/${this.params.queueId}`) ||
      this.router.url.endsWith(`/queues/${this.params.queueId}/json`)
    );
  }

  private params: Params;
  private subscriptions = [
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/subscriptions/queue-members' } as WebSocketRequest,
      service: this.queueMemberService,
      store: this.queueMemberStore,
    },
  ];
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private queueMemberService: QueueMemberService,
    private queueMemberStore: QueueMemberStore,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private tokenService: TokenService,
    private webSocketService: WebSocketService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$namespace = this.namespaceQuery.selectEntity(params.namespaceId);

      if (params.queueId === 'new') {
        return;
      }

      this.$queue = this.queueQuery.selectEntity(params.queueId);
      await this.queueService.findOne(params.namespaceId, params.queueId);

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
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.subscribe(
        s.Model,
        { ...s.request, body: { where: { queueId: this.params.queueId } } },
        s.service,
        s.store,
        this.webSocketUrl,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }

  private unsubscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.unsubscribe(s.request._id, this.webSocketUrl),
    );

    return Promise.all(promises);
  }
}
