import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  AuthorizationQuery,
  IAuthorization,
  StorefrontModel,
  StorefrontQuery,
  StorefrontService,
} from '@tenlastic/http';
import { IdentityService } from '../../../../../../core/services';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $storefront: Observable<StorefrontModel>;
  public IAuthorization = IAuthorization;

  private params: Params;

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private identityService: IdentityService,
    private storefrontQuery: StorefrontQuery,
    private storefrontService: StorefrontService,
  ) {}

  public async ngOnInit() {
    this.activatedRoute.params.subscribe(async (params) => {
      this.params = params;

      this.$storefront = this.storefrontQuery
        .selectAll({ filterBy: (s) => s.namespaceId === params.namespaceId })
        .pipe(map((s) => s[0]));

      await this.storefrontService.find(params.namespaceId, { limit: 1 });
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
