import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  Authorization,
  AuthorizationQuery,
  AuthorizationService,
  IAuthorization,
  User,
  UserQuery,
  UserService,
} from '@tenlastic/ng-http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { IdentityService } from '../../../../../../core/services';

@Component({
  selector: 'namespace-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit {
  public $authorization: Observable<Authorization>;
  public $user: Observable<User>;
  public IAuthorization = IAuthorization;

  private get userId() {
    return this.activatedRoute.snapshot.params.userId;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private identityService: IdentityService,
    private userQuery: UserQuery,
    private userService: UserService,
  ) {}

  public async ngOnInit() {
    this.$authorization = this.authorizationQuery
      .selectAll({ filterBy: (a) => a.userId === this.userId })
      .pipe(map((a) => a[0]));
    this.$user = this.userQuery.selectEntity(this.userId);

    await Promise.all([
      this.authorizationService.find({
        limit: 1,
        where: { namespaceId: { $exists: false }, userId: this.userId },
      }),
      this.userService.findOne(this.userId),
    ]);
  }

  public $hasPermission(roles: IAuthorization.AuthorizationRole[]) {
    return this.authorizationQuery.selectHasRoles(null, roles, this.identityService.user?._id);
  }
}
