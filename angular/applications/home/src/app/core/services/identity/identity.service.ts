import { Injectable } from '@angular/core';
import {
  AuthorizationModel,
  AuthorizationState,
  Jwt,
  TokenService,
  UserModel,
  UserState,
} from '@tenlastic/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class IdentityService {
  public get $authorization() {
    return this._$authorization;
  }
  public get $user() {
    return this._$user;
  }
  public get user() {
    return this._user;
  }

  private _$authorization = new Observable<AuthorizationModel>();
  private _$user = new Observable<UserModel>();
  private _user: UserModel;

  constructor(
    private authorizationState: AuthorizationState,
    private tokenService: TokenService,
    private userState: UserState,
  ) {
    this.tokenService.emitter.on('accessToken', (accessToken) => this.setAccessToken(accessToken));
    this.tokenService.getAccessToken().then((accessToken) => this.setAccessToken(accessToken));
  }

  public setAccessToken(accessToken: Jwt) {
    this._user = accessToken?.payload?.user;

    if (this._user) {
      this.userState.upsertMany([this._user]);
    }

    this._$authorization = this.authorizationState
      .selectMany()
      .pipe(map((as) => as.filter((a) => !a.namespaceId && a.userId === this._user?._id)))
      .pipe(map((a) => a[0]));
    this._$user = this.userState
      .selectMany()
      .pipe(map((us) => us.filter((u) => this._user?._id === u?._id)))
      .pipe(map((u) => u[0]));
  }
}
