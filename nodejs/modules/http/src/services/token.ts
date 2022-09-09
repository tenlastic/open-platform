import wait from '@tenlastic/wait';
import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { Jwt } from '../models/jwt';
import { LoginService, LoginServiceResponse } from './login';

export interface Storage {
  getItem: (key: string) => string;
  removeItem: (key: string) => void;
  setItem: (key: string, value: string) => void;
}

export type TokenServiceEvents = {
  accessToken: (value: Jwt) => void;
  refreshToken: (value: Jwt) => void;
};

export class TokenService {
  public emitter = new EventEmitter() as TypedEmitter<TokenServiceEvents>;

  private accessToken: Jwt;
  private refreshToken: Jwt;
  private startedRefreshingAt: Date;

  constructor(private localStorage: Storage, private loginService: LoginService) {}

  public clear() {
    this.setAccessToken(null);
    this.setRefreshToken(null);
  }

  public async getAccessToken() {
    try {
      await wait(250, 15 * 1000, () => {
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
      const response = await this.loginService.createWithRefreshToken(refreshToken.value);
      this.accessToken = new Jwt(response.accessToken);
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
      this.localStorage?.setItem('accessToken', this.accessToken.value);
    } else {
      this.localStorage?.removeItem('accessToken');
    }

    this.emitter.emit('accessToken', this.accessToken);
  }

  public getRefreshToken() {
    if (this.refreshToken) {
      return this.refreshToken;
    }

    const refreshToken = this.localStorage?.getItem('refreshToken');
    this.refreshToken = refreshToken ? new Jwt(refreshToken) : null;

    return this.refreshToken;
  }

  public setRefreshToken(value: string) {
    this.refreshToken = value ? new Jwt(value) : null;

    if (this.refreshToken) {
      this.localStorage?.setItem('refreshToken', this.refreshToken.value);
    } else {
      this.localStorage?.removeItem('refreshToken');
    }

    this.emitter.emit('refreshToken', this.refreshToken);
  }

  private login(data: LoginServiceResponse) {
    this.setAccessToken(data.accessToken);
    this.setRefreshToken(data.refreshToken);
  }
}
