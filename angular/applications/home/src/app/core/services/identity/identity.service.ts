import { Injectable } from '@angular/core';
import { AuthorizationQuery, TokenService, UserModel } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  public authorization = this.authorizationQuery.getAll({
    filterBy: (a) => !a.namespaceId && a.userId === this.user?._id,
  })[0];
  public get user() {
    return this._user;
  }

  private _user: UserModel;

  constructor(private authorizationQuery: AuthorizationQuery, private tokenService: TokenService) {
    this.tokenService.emitter.on(
      'accessToken',
      (accessToken) => (this._user = accessToken?.payload?.user),
    );
  }
}
