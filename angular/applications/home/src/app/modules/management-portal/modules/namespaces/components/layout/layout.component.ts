import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationModel,
  AuthorizationStore,
  AuthorizationQuery,
  AuthorizationService,
  BuildModel,
  BuildService,
  BuildStore,
  CollectionModel,
  CollectionService,
  CollectionStore,
  GameServerModel,
  GameServerService,
  GameServerStore,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  QueueMemberModel,
  QueueMemberService,
  QueueMemberStore,
  QueueModel,
  QueueService,
  QueueStore,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
  StorefrontStore,
  StreamService,
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

  private subscribe$ = new Subscription();
  private connected = false;
  private params: Params;
  private get streamServiceUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }
  private subscriptions = [
    {
      Model: AuthorizationModel,
      parameters: { _id: uuid(), collection: 'authorizations' },
      service: this.authorizationService,
      store: this.authorizationStore,
    },
    {
      Model: BuildModel,
      parameters: { _id: uuid(), collection: 'builds' },
      service: this.buildService,
      store: this.buildStore,
    },
    {
      Model: CollectionModel,
      parameters: { _id: uuid(), collection: 'collections' },
      service: this.collectionService,
      store: this.collectionStore,
    },
    {
      Model: GameServerModel,
      parameters: { _id: uuid(), collection: 'game-servers' },
      service: this.gameServerService,
      store: this.gameServerStore,
    },
    {
      Model: QueueMemberModel,
      parameters: { _id: uuid(), collection: 'queue-members' },
      service: this.queueMemberService,
      store: this.queueMemberStore,
    },
    {
      Model: QueueModel,
      parameters: { _id: uuid(), collection: 'queues' },
      service: this.queueService,
      store: this.queueStore,
    },
    {
      Model: StorefrontModel,
      parameters: { _id: uuid(), collection: 'storefronts' },
      service: this.storefrontService,
      store: this.storefrontStore,
    },
    {
      Model: WorkflowModel,
      parameters: { _id: uuid(), collection: 'workflows' },
      service: this.workflowService,
      store: this.workflowStore,
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private authorizationStore: AuthorizationStore,
    private buildService: BuildService,
    private buildStore: BuildStore,
    private collectionService: CollectionService,
    private collectionStore: CollectionStore,
    private gameServerService: GameServerService,
    private gameServerStore: GameServerStore,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private queueMemberService: QueueMemberService,
    private queueMemberStore: QueueMemberStore,
    private queueService: QueueService,
    private queueStore: QueueStore,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
    private storefrontStore: StorefrontStore,
    private streamService: StreamService,
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
      this.$storefront = this.storefrontQuery
        .selectAll({ filterBy: (s) => s.namespaceId === params.namespaceId })
        .pipe(map((s) => s[0]));

      this.subscribe$ = this.$namespace.subscribe(async (namespace) => {
        if (this.connected) {
          return;
        }

        if (namespace?.status?.phase === 'Running') {
          this.connected = true;
          return Promise.all([this.streamService.connect(this.streamServiceUrl), this.subscribe()]);
        }
      });

      await Promise.all([
        this.authorizationService.findUserAuthorizations(params.namespaceId, null),
        this.namespaceService.findOne(params.namespaceId),
        this.storefrontService.find(params.namespaceId, { limit: 1 }),
      ]);
    });
  }

  public ngOnDestroy() {
    this.streamService.close(this.streamServiceUrl);
    this.subscribe$.unsubscribe();
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
      this.streamService.subscribe(
        s.Model,
        s.parameters,
        s.service,
        s.store,
        this.streamServiceUrl,
      ),
    );

    return Promise.all(promises);
  }
}
