import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  UserModel,
  UserQuery,
  UserService,
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
    const roles = [...IAuthorization.webSocketRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $user: Observable<UserModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/namespaces/${this.params.namespaceId}`) ||
      this.router.url.endsWith(`/namespaces/${this.params.namespaceId}/json`)
    );
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private router: Router,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.userId === 'new') {
        return;
      }

      this.$user = this.userQuery.selectEntity(params.userId);

      await Promise.all([
        this.authorizationService.findUserAuthorizations(null, params.userId),
        this.userService.findOne(params.userId),
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
