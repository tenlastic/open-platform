import { Injectable } from '@angular/core';
import { EventEmitter } from 'events';

import { ApiService } from './api/api';
import { EnvironmentService } from './environment';

export class LoginServiceEventEmitter extends EventEmitter {
  public emit<U extends keyof LoginServiceEvents>(
    event: U,
    ...args: Parameters<LoginServiceEvents[U]>
  ) {
    super.emit(event, ...args);
  }

  public on<U extends keyof LoginServiceEvents>(event: U, listener: LoginServiceEvents[U]) {
    super.on(event, listener);
  }
}

export declare interface LoginServiceEventEmitter {
  emit<U extends keyof LoginServiceEvents>(event: U, ...args: Parameters<LoginServiceEvents[U]>);
  on<U extends keyof LoginServiceEvents>(event: U, listener: LoginServiceEvents[U]);
}

export interface LoginServiceEvents {
  login: (record: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  refresh: (record: { accessToken: string; refreshToken: string }) => void;
}

export class LoginService {
  public emitter = new LoginServiceEventEmitter();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

  /**
   * Logs in with a Username and Password.
   */
  public async createWithCredentials(username: string, password: string) {
    const parameters = { password, username };
    const url = this.getUrl();
    const response = await this.apiService.observable('post', url, parameters);

    const { accessToken, refreshToken } = response;
    this.emitter.emit('login', { accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  /**
   * Logs in with a Refresh Token.
   */
  public async createWithRefreshToken(token: string) {
    const parameters = { token };
    const url = this.getUrl();
    const response = await this.apiService.observable('post', url + '/refresh-token', parameters);

    const { accessToken, refreshToken } = response;
    this.emitter.emit('refresh', { accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  /**
   * Logs out.
   */
  public async delete() {
    const url = this.getUrl();
    await this.apiService.observable('delete', url);

    this.emitter.emit('logout');
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/logins`;
  }
}
