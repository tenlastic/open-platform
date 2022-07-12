import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AuthorizationQuery,
  Collection,
  CollectionQuery,
  CollectionService,
  IAuthorization,
} from '@tenlastic/ng-http';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  selector: 'collections-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $collection: Observable<Collection>;
  public IAuthorization = IAuthorization;

  private get collectionId() {
    return this.activatedRoute.snapshot.params.collectionId;
  }
  private get namespaceId() {
    return this.activatedRoute.snapshot.params.namespaceId;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private collectionQuery: CollectionQuery,
    private collectionService: CollectionService,
    private identityService: IdentityService,
  ) {}

  public async ngOnInit() {
    this.$collection = this.collectionQuery.selectEntity(this.collectionId);
    await this.collectionService.findOne(this.collectionId);
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    const userId = this.identityService.user?._id;

    return combineLatest([
      this.authorizationQuery.selectHasRoles(null, roles, userId),
      this.authorizationQuery.selectHasRoles(this.namespaceId, roles, userId),
    ]).pipe(map((a, b) => a || b));
  }
}
