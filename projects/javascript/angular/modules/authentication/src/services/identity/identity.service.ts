import { Injectable } from '@angular/core';
import { IOnLogin, LoginService, User, UserService } from '@tenlastic/ng-http';
import jwtDecode from 'jwt-decode';

export class Jwt {
  public exp: Date;
  public user: User;

  constructor(value: string) {
    const decodedValue = jwtDecode(value) as any;

    this.exp = new Date(decodedValue.exp * 1000);
    this.user = decodedValue.user;
  }

  public get isExpired() {
    return new Date() > this.exp;
  }
}

@Injectable({ providedIn: 'root' })
export class IdentityService {
  public get accessToken() {
    if (this._accessToken) {
      return this._accessToken;
    }

    const accessToken = localStorage.getItem('accessToken');
    this._accessToken = accessToken;

    return this._accessToken;
  }
  public set accessToken(value: string) {
    if (value) {
      localStorage.setItem('accessToken', value);
    } else {
      localStorage.removeItem('accessToken');
    }

    this._accessToken = value;
  }
  public get accessTokenJwt() {
    return this.accessToken ? new Jwt(this.accessToken) : null;
  }
  public get refreshToken() {
    if (this._refreshToken) {
      return this._refreshToken;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    this._refreshToken = refreshToken;

    return this._refreshToken;
  }
  public set refreshToken(value: string) {
    if (value) {
      localStorage.setItem('refreshToken', value);
    } else {
      localStorage.removeItem('refreshToken');
    }

    this._refreshToken = value;
  }
  public get refreshTokenJwt() {
    return this.refreshToken ? new Jwt(this.refreshToken) : null;
  }
  public get user() {
    if (this.accessToken && !this._user) {
      const jwt = jwtDecode(this.accessToken) as any;
      this._user = jwt.user;
    } else if (!this.accessToken && this._user) {
      this._user = null;
    }

    return this._user;
  }

  private _accessToken: string;
  private _refreshToken: string;
  private _user: User;

  constructor(private loginService: LoginService, private userService: UserService) {
    this.loginService.onLogin.subscribe(this.login.bind(this));
    this.loginService.onLogout.subscribe(this.clear.bind(this));
    this.userService.onUpdate.subscribe(this.updateUser.bind(this));
  }

  public clear() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  private login(data: IOnLogin) {
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
  }

  private updateUser(user: User) {
    if (user._id === this.user._id) {
      this._user = user;
    }
  }
}
