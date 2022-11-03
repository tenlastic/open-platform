import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
  AuthorizationQuery,
  CollectionModel,
  CollectionQuery,
  CollectionService,
  IAuthorization,
} from '@tenlastic/http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $collection: Observable<CollectionModel>;
  public get $hasRelated() {
    const roles = [...IAuthorization.collectionRoles];
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.params.namespaceId, roles, userId),
    ]).pipe(map(([a, b]) => a || b));
  }
  public IAuthorization = IAuthorization;
  public get isActive() {
    return (
      this.router.url.endsWith(`/collections/${this.params.collectionId}`) ||
      this.router.url.endsWith(`/collections/${this.params.collectionId}/json`)
    );
  }

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
    private router: Router,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      this.params = params;

      if (params.collectionId === 'new') {
        return;
      }

      this.$collection = this.collectionQuery.selectEntity(params.collectionId);
      return this.collectionService.findOne(params.namespaceId, params.collectionId);
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
