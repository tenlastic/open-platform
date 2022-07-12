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
  public get $hasAuthorizationButtons() {
    const roles = [...IAuthorization.authorizationRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
  public get $hasInfrastructureButtons() {
    const roles = [
      ...IAuthorization.buildRoles,
      ...IAuthorization.collectionRoles,
      ...IAuthorization.gameServerRoles,
      ...IAuthorization.queueRoles,
      ...IAuthorization.workflowRoles,
    ];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
  public get $hasLauncherButtons() {
    const roles = [...IAuthorization.articleRoles, ...IAuthorization.gameRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
  public $namespace: Observable<Namespace>;
  public IAuthorization = IAuthorization;
  public showAuthorizationButtons = true;
  public showInfrastructureButtons = true;
  public showLauncherButtons = true;

  private get namespaceId() {
    return this.activatedRoute.snapshot.params.namespaceId;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private namespaceQuery: NamespaceQuery,
    private namespaceService: NamespaceService,
  ) {}

  public async ngOnInit() {
    this.$namespace = this.namespaceQuery.selectEntity(this.namespaceId);
    await this.namespaceService.findOne(this.namespaceId);
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
}
