import { AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationService,
  AuthorizationState,
  IAuthorization,
  UserModel,
  UserService,
  UserState,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SideMenuService } from '@home/app/core/services';

@Component({
  standalone: false,
  styleUrls: ['./layout.component.scss'],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements AfterViewInit, OnDestroy, OnInit {
  @ViewChild('sideMenu') private sideMenuTemplate: TemplateRef<unknown>;

  public get $displayName() {
    return this.$user.pipe(map((u) => u.displayName));
  }
  public get $hasRelated() {
    const roles = [...IAuthorization.webSocketRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $user: Observable<UserModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/users/${this.params.userId}`) ||
      this.router.url.endsWith(`/users/${this.params.userId}/json`)
    );
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private router: Router,
    private sideMenuService: SideMenuService,
    private userState: UserState,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      if (params.userId === 'new') {
        return;
      }

      this.$user = this.userState.selectOne(params.userId);

      await Promise.all([
        this.authorizationService.findUserAuthorizations(null, params.userId),
        this.userService.findOne(params.userId),
      ]);
    });
  }

  public ngAfterViewInit() {
    this.sideMenuService.add(this.sideMenuTemplate);
  }

  public ngOnDestroy() {
    this.sideMenuService.remove(this.sideMenuTemplate);
  }

  public $hasPermission(roles: IAuthorization.Role[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
}
