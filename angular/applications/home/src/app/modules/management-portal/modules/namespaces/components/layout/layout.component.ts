import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  Namespace,
  NamespaceQuery,
  NamespaceService,
  Storefront,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/ng-http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  selector: 'app-namespace-layout',
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
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<Namespace>;
  public $storefront: Observable<Storefront>;
  public IAuthorization = IAuthorization;

  private get namespaceId() {
    return this.activatedRoute.snapshot.params.namespaceId;
  }

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
    this.$namespace = this.namespaceQuery.selectEntity(this.namespaceId);
    this.$storefront = this.storefrontQuery
      .selectAll({ filterBy: (s) => s.namespaceId === this.namespaceId })
      .pipe(map((s) => s[0]));

    await Promise.all([
      this.authorizationService.findUserAuthorizations(this.namespaceId, null),
      this.namespaceService.findOne(this.namespaceId),
      this.storefrontService.find({ limit: 1, where: { namespaceId: this.namespaceId } }),
    ]);
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
}
