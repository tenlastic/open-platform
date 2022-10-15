import { Injectable } from '@angular/core';
import {
  AuthorizationModel,
  AuthorizationQuery,
  Jwt,
  TokenService,
  UserModel,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  public get $authorization() {
    return this._$authorization;
  }
  public get user() {
    return this._user;
  }

  private _$authorization = new Observable<AuthorizationModel>();
  private _user: UserModel;

  constructor(private authorizationQuery: AuthorizationQuery, private tokenService: TokenService) {
    this.tokenService.emitter.on('accessToken', (accessToken) => this.setAccessToken(accessToken));
    this.tokenService.getAccessToken().then((accessToken) => this.setAccessToken(accessToken));
  }

  public setAccessToken(accessToken: Jwt) {
    this._user = accessToken?.payload?.user;
    this._$authorization = this.authorizationQuery
      .selectAll({ filterBy: (a) => !a.namespaceId && a.userId === this._user?._id })
      .pipe(map((a) => a[0]));
  }
}
