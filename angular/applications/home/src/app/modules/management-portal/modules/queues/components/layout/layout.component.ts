import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  NamespaceModel,
  NamespaceState,
  QueueModel,
  QueueService,
  QueueState,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SideMenuService } from '@home/app/core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  @ViewChild('sideMenu', { static: true }) private sideMenuTemplate: TemplateRef<unknown>;

  public get $hasRelated() {
    const roles = [...IAuthorization.gameServerRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public $queue: Observable<QueueModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/queues/${this.queueId}`) ||
      this.router.url.endsWith(`/queues/${this.queueId}/json`)
    );
  }

  private namespaceId: string;
  private queueId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private namespaceState: NamespaceState,
    private queueState: QueueState,
    private queueService: QueueService,
    private router: Router,
    private sideMenuService: SideMenuService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;
      this.queueId = params.queueId;

      this.$namespace = this.namespaceState.selectOne(this.namespaceId);

      if (this.queueId === 'new') {
        return;
      }

      this.$queue = this.queueState.selectOne(this.queueId);

      this.sideMenuService.add(this.sideMenuTemplate);

      await this.queueService.findOne(this.namespaceId, this.queueId);
    });
  }

  public async ngOnDestroy() {
    this.sideMenuService.remove(this.sideMenuTemplate);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
}
