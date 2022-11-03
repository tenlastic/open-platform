import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  QueueModel,
  QueueQuery,
  QueueService,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public get $hasRelated() {
    const roles = [...IAuthorization.gameServerRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $queue: Observable<QueueModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/queues/${this.params.queueId}`) ||
      this.router.url.endsWith(`/queues/${this.params.queueId}/json`)
    );
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.queueId === 'new') {
        return;
      }

      this.$queue = this.queueQuery.selectEntity(this.params.queueId);
      await this.queueService.findOne(this.params.namespaceId, this.params.queueId);
    });
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
}
