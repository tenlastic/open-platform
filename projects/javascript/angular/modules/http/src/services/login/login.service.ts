import { Injectable, EventEmitter } from '@angular/core';

import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface IOnLogin {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class LoginService {
  public basePath: string;

  public onLogin = new EventEmitter<IOnLogin>();
  public onLogout = new EventEmitter();
  public onRefresh = new EventEmitter<IOnLogin>();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.loginApiBaseUrl;
  }

  public async createWithCredentials(email: string, password: string) {
    const parameters = { email, password };
    const response = await this.apiService.request('post', this.basePath, parameters);

    const { accessToken, refreshToken } = response;
    this.onLogin.emit({ accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  public async createWithRefreshToken(token: string) {
    const parameters = { token };
    const response = await this.apiService.request(
      'post',
      this.basePath + '/refresh-token',
      parameters,
    );

    const { accessToken, refreshToken } = response;
    this.onRefresh.emit({ accessToken, refreshToken });

    return { accessToken, refreshToken };
  }

  public async delete() {
    await this.apiService.request('delete', this.basePath);

    this.onLogout.emit();
  }
}
