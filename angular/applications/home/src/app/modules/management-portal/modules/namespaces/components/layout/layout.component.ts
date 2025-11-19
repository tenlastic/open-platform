import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationService,
  AuthorizationState,
  BuildState,
  CollectionState,
  GameServerState,
  GameServerTemplateState,
  IAuthorization,
  NamespaceModel,
  NamespaceService,
  NamespaceState,
  QueueState,
  StorefrontModel,
  StorefrontService,
  StorefrontState,
  WebSocketService,
  WebSocketState,
  WorkflowState,
} from '@tenlastic/http';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SideMenuService } from '@home/app/core/services';
import { environment } from '@home/environments/environment';

@Component({
  standalone: false,
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  @ViewChild('sideMenu', { static: true }) private sideMenuTemplate: TemplateRef<unknown>;

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
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public get $sideMenuIsVisible() {
    return this.sideMenuService.$visible;
  }
  public $storefront: Observable<StorefrontModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/namespaces/${this.namespaceId}`) ||
      this.router.url.endsWith(`/namespaces/${this.namespaceId}/json`)
    );
  }

  private fetchStorefront$ = new Subscription();
  private subscribe$ = new Subscription();
  private namespaceId: string;
  private get webSocket() {
    return this.webSocketService.webSockets.find((ws) => this.webSocketUrl === ws.url);
  }
  private get webSocketUrl() {
    return `${environment.wssUrl}/namespaces/${this.namespaceId}`;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private authorizationService: AuthorizationService,
    private buildState: BuildState,
    private collectionState: CollectionState,
    private gameServerState: GameServerState,
    private gameServerTemplateState: GameServerTemplateState,
    private identityService: IdentityService,
    private namespaceState: NamespaceState,
    private namespaceService: NamespaceService,
    private queueState: QueueState,
    private router: Router,
    private sideMenuService: SideMenuService,
    private storefrontState: StorefrontState,
    private storefrontService: StorefrontService,
    private webSocketService: WebSocketService,
    private webSocketState: WebSocketState,
    private workflowState: WorkflowState,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      if (this.webSocket) {
        this.webSocketService.close(this.webSocket);
      }

      this.namespaceId = params?.namespaceId;

      if (this.namespaceId === 'new') {
        return;
      }

      this.$namespace = this.namespaceState.selectOne(this.namespaceId);
      this.$storefront = this.storefrontState.selectOne(this.namespaceId);

      this.fetchStorefront$ = this.$namespace.subscribe(async (namespace) => {
        if (namespace?.status.phase === 'Running') {
          return this.storefrontService.find(this.namespaceId, { limit: 1 });
        }
      });
      this.subscribe$ = this.$namespace.subscribe((namespace) => {
        if (namespace?.status?.phase === 'Running') {
          this.connectSocket();
        }
      });

      this.sideMenuService.add(this.sideMenuTemplate);

      await Promise.all([
        this.authorizationService.findUserAuthorizations(this.namespaceId, null),
        this.namespaceService.findOne(this.namespaceId),
      ]);
    });
  }

  public ngOnDestroy() {
    this.buildState.reset();
    this.collectionState.reset();
    this.gameServerState.reset();
    this.gameServerTemplateState.reset();
    this.queueState.reset();
    this.webSocketState.reset();
    this.workflowState.reset();

    this.fetchStorefront$.unsubscribe();
    this.sideMenuService.remove(this.sideMenuTemplate);
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

  private async connectSocket() {
    if (this.webSocket) {
      return;
    }

    return Promise.all([this.webSocketService.connect(this.webSocketUrl)]);
  }
}
