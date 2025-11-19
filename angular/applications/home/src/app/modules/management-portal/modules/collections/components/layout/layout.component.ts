import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AuthorizationState,
  CollectionModel,
  CollectionService,
  CollectionState,
  IAuthorization,
  NamespaceModel,
  NamespaceState,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService, SideMenuService } from '@home/app/core/services';

@Component({
  standalone: false,
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnDestroy, OnInit {
  @ViewChild('sideMenu', { static: true }) private sideMenuTemplate: TemplateRef<unknown>;

  public $collection: Observable<CollectionModel>;
  public get $hasRelated() {
    const roles = [...IAuthorization.collectionRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationState.selectHasRoles(null, roles, userId),
      this.authorizationState.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public $namespace: Observable<NamespaceModel>;
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/collections/${this.collectionId}`) ||
      this.router.url.endsWith(`/collections/${this.collectionId}/json`)
    );
  }

  private collectionId: string;
  private namespaceId: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationState: AuthorizationState,
    private collectionState: CollectionState,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private namespaceState: NamespaceState,
    private router: Router,
    private sideMenuService: SideMenuService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.collectionId = params.collectionId;
      this.namespaceId = params.namespaceId;

      this.$namespace = this.namespaceState.selectOne(this.namespaceId);

      if (this.collectionId === 'new') {
        return;
      }

      this.$collection = this.collectionState.selectOne(this.collectionId);

      this.sideMenuService.add(this.sideMenuTemplate);

      await this.collectionService.findOne(this.namespaceId, this.collectionId);
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
