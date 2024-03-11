import { EventEmitter } from 'events';
import TypedEmitter from 'typed-emitter';

import { ApiService } from './api';
import { EnvironmentService } from './environment';

export type LoginServiceEvents = {
  login: (response: LoginServiceResponse) => void;
  logout: () => void;
  refresh: (response: LoginServiceResponse) => void;
};

export interface LoginServiceResponse {
  accessToken: string;
  refreshToken: string;
}

export class LoginService {
  public get emitter() {
    return this._emitter;
  }

  private _emitter = new EventEmitter() as TypedEmitter<LoginServiceEvents>;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

  /**
   * Logs in with a Username and Password.
   */
  public async createWithCredentials(username: string, password: string) {
    const parameters = { password, username };
    const url = this.getUrl();
    const response = await this.apiService.request({ data: parameters, method: 'post', url });

    const { accessToken, refreshToken } = response.data as LoginServiceResponse;
    this.emitter.emit('login', { accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  /**
   * Logs in with a Refresh Token.
   */
  public async createWithRefreshToken(token: string) {
    const parameters = { token };
    const url = this.getUrl();
    const response = await this.apiService.request({
      data: parameters,
      method: 'post',
      url: `${url}/refresh-token`,
    });

    const { accessToken, refreshToken } = response.data as LoginServiceResponse;
    this.emitter.emit('refresh', { accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  /**
   * Logs in with Steam.
   */
  public async createWithSteam(
    assocHandle: string,
    claimedId: string,
    identity: string,
    responseNonce: string,
    returnTo: string,
    sig: string,
    signed: string,
  ) {
    const parameters = { assocHandle, claimedId, identity, responseNonce, returnTo, sig, signed };
    const url = this.getUrl();
    const response = await this.apiService.request({
      data: parameters,
      method: 'post',
      url: `${url}/steam`,
    });

    const { accessToken, refreshToken } = response.data as LoginServiceResponse;
    this.emitter.emit('login', { accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  /**
   * Logs out.
   */
  public async delete() {
    const url = this.getUrl();
    await this.apiService.request({ method: 'delete', url });

    this.emitter.emit('logout');
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/logins`;
  }
}
