import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  NamespaceModel,
  NamespaceQuery,
  NamespaceService,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
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

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      if (params.namespaceId === 'new') {
        return;
      }

      this.$namespace = this.namespaceQuery.selectEntity(params.namespaceId);
      this.$storefront = this.storefrontQuery
        .selectAll({ filterBy: (s) => s.namespaceId === params.namespaceId })
        .pipe(map((s) => s[0]));

      return Promise.all([
        this.authorizationService.findUserAuthorizations(params.namespaceId, null),
        this.namespaceService.findOne(params.namespaceId),
        this.storefrontService.find(params.namespaceId, { limit: 1 }),
      ]);
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
