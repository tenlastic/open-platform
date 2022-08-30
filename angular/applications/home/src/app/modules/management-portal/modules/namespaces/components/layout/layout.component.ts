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
  private params: Params;
  private get streamServiceUrl() {
    return `${environment.wssUrl}/namespaces/${this.params.namespaceId}`;
  }
  private subscriptions: string[] = [];

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
        if (this.subscriptions.length > 0) {
          return;
        }

        if (namespace?.status?.phase === 'Running') {
          await this.streamService.connect(this.streamServiceUrl);
          this.subscriptions = await this.subscribe();
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
    return Promise.all([
      this.streamService.subscribe(
        AuthorizationModel,
        { collection: 'authorizations' },
        this.authorizationService,
        this.authorizationStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        BuildModel,
        { collection: 'builds' },
        this.buildService,
        this.buildStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        CollectionModel,
        { collection: 'collections' },
        this.collectionService,
        this.collectionStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        GameServerModel,
        { collection: 'game-servers' },
        this.gameServerService,
        this.gameServerStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        QueueMemberModel,
        { collection: 'queue-members' },
        this.queueMemberService,
        this.queueMemberStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        QueueModel,
        { collection: 'queues' },
        this.queueService,
        this.queueStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        StorefrontModel,
        { collection: 'storefronts' },
        this.storefrontService,
        this.storefrontStore,
        this.streamServiceUrl,
      ),
      this.streamService.subscribe(
        WorkflowModel,
        { collection: 'workflows' },
        this.workflowService,
        this.workflowStore,
        this.streamServiceUrl,
      ),
    ]);
  }
}
