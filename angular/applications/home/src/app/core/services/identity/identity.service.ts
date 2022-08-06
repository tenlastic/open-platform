import { EventEmitter, Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthorizationQuery, LoginService, UserModel } from '@tenlastic/ng-http';

export class ExpiredRefreshTokenError extends Error {
  constructor(message?: string) {
    super(message);

    this.name = 'ExpiredRefreshTokenError';
  }
}

export class Jwt {
  public get isExpired() {
    return new Date() > this.payload.exp;
  }
  public get payload() {
    return this._payload;
  }
  public get value() {
    return this._value;
  }

  private _payload: JwtPayload;
  private _value: string;

  constructor(value: string) {
    const jwtHelperService = new JwtHelperService();
    const decodedValue = jwtHelperService.decodeToken(value);

    this._payload = {
      exp: decodedValue.exp ? new Date(decodedValue.exp * 1000) : null,
      iat: decodedValue.iat ? new Date(decodedValue.iat * 1000) : null,
      jti: decodedValue.jti,
      user: decodedValue.user ? new UserModel(decodedValue.user) : null,
    };
    this._value = value;
  }
}

export interface JwtPayload {
  exp?: Date;
  iat?: Date;
  jti?: string;
  user?: UserModel;
}

@Injectable({ providedIn: 'root' })
export class IdentityService {
  public OnAccessTokenSet = new EventEmitter<string>();
  public OnRefreshTokenSet = new EventEmitter<string>();

  public authorization = this.authorizationQuery.getAll({
    filterBy: (a) => !a.namespaceId && a.userId === this.user?._id,
  })[0];
  public get user() {
    const refreshToken = this.getRefreshToken();

    if (this.accessToken) {
      return this.accessToken.payload.user;
    } else if (refreshToken) {
      return refreshToken.payload.user;
    }

    return null;
  }

  private accessToken: Jwt;
  private refreshToken: Jwt;
  private startedRefreshingAt: Date;

  constructor(private authorizationQuery: AuthorizationQuery, private loginService: LoginService) {
    this.loginService.emitter.on('login', this.login.bind(this));
    this.loginService.emitter.on('logout', this.clear.bind(this));
    this.loginService.emitter.on('refresh', this.login.bind(this));
  }

  public clear() {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  public async getAccessToken() {
    try {
      await this.wait(250, 15 * 1000, () => {
        if (!this.startedRefreshingAt) {
          return true;
        }

        const milliseconds = Date.now() - this.startedRefreshingAt.getTime();
        return milliseconds >= 5 * 1000;
      });
    } catch {
      return null;
    }

    // If the access token is still valid, return it.
    if (this.accessToken && !this.accessToken.isExpired) {
      return this.accessToken;
    }

    // If we do not have a refresh token or it is expired, return nothing.
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    this.startedRefreshingAt = new Date();

    try {
      await this.loginService.createWithRefreshToken(refreshToken.value);
    } catch (e) {
      console.error(e);
      return null;
    }

    this.startedRefreshingAt = null;

    return this.accessToken;
  }

  public setAccessToken(value: string) {
    this.accessToken = value ? new Jwt(value) : null;

    if (this.accessToken) {
      localStorage.setItem('accessToken', this.accessToken.value);
    } else {
      localStorage.removeItem('accessToken');
    }

    this.OnAccessTokenSet.emit(value);
  }

  public getRefreshToken() {
    if (this.refreshToken) {
      return this.refreshToken;
    }

    const refreshToken = localStorage.getItem('refreshToken');
    this.refreshToken = refreshToken ? new Jwt(refreshToken) : null;

    return this.refreshToken;
  }

  public setRefreshToken(value: string) {
    this.refreshToken = value ? new Jwt(value) : null;

    if (this.refreshToken) {
      localStorage.setItem('refreshToken', this.refreshToken.value);
    } else {
      localStorage.removeItem('refreshToken');
    }

    this.OnRefreshTokenSet.emit(value);
  }

  private login(data: { accessToken: string; refreshToken: string }) {
    this.setAccessToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
  }

  private async wait(frequency: number, timeout: number, condition: () => any) {
    const wait = async () => {
      while (!condition()) {
        await new Promise((res) => setTimeout(res, frequency));
      }
    };

    return Promise.race([wait(), new Promise((res, rej) => setTimeout(rej, timeout))]);
  }
}
