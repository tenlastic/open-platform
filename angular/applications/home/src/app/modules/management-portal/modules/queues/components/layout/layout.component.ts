import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  Namespace,
  NamespaceQuery,
  NamespaceService,
} from '@tenlastic/ng-http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  selector: 'namespace-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $queue: Observable<Namespace>;
  public IAuthorization = IAuthorization;

  private get namespaceId() {
    return this.activatedRoute.snapshot.params.namespaceId;
  }
  private get queueId() {
    return this.activatedRoute.snapshot.params.queueId;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private queueQuery: NamespaceQuery,
    private queueService: NamespaceService,
  ) {}

  public async ngOnInit() {
    this.$queue = this.queueQuery.selectEntity(this.queueId);
    await this.queueService.findOne(this.queueId);
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
}
