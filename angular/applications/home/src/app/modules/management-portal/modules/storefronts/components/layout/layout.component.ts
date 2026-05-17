import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  IAuthorization,
  NamespaceModel,
  NamespaceState,
  StorefrontModel,
  StorefrontService,
  StorefrontState,
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

  public $namespace: Observable<NamespaceModel>;
  public $storefront: Observable<StorefrontModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return this.router.url.endsWith(`/storefront`) || this.router.url.endsWith(`/storefront/json`);
  }

  private namespaceId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private identityService: IdentityService,
    private namespaceState: NamespaceState,
    private router: Router,
    private sideMenuService: SideMenuService,
    private storefrontState: StorefrontState,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.namespaceId = params.namespaceId;

      this.$namespace = this.namespaceState.selectOne(this.namespaceId);
      this.$storefront = this.storefrontState.selectOne(this.namespaceId);

      this.sideMenuService.add(this.sideMenuTemplate);

      await this.storefrontService.find(this.namespaceId, { limit: 1 });
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
