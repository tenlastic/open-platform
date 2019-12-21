import { Injectable } from '@angular/core';
import jwtDecode from 'jwt-decode';

import { User } from '../../models/user';
import { IOnLogin, LoginService } from '../login/login.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
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

      const jwt = jwtDecode(value) as any;
      this.user = jwt.user;
    } else {
      localStorage.removeItem('accessToken');
    }

    this._accessToken = value;
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
  public user: User;

  private _accessToken: string;
  private _refreshToken: string;

  constructor(private loginService: LoginService, private userService: UserService) {
    this.loginService.onLogin.subscribe(this.login.bind(this));
    this.loginService.onLogout.subscribe(this.clear.bind(this));
    this.userService.onUpdate.subscribe(this.updateUser.bind(this));

    this.accessToken = localStorage.getItem('token');
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
      this.user = user;
    }
  }
}
