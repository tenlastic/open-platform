import { Injectable, EventEmitter } from '@angular/core';

import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

export interface IOnLogin {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginService {
  public basePath: string;

  public onLogin = new EventEmitter<IOnLogin>();
  public onLogout = new EventEmitter();

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.loginApiBaseUrl;
  }

  public async createWithCredentials(email: string, password: string) {
    const parameters = { email, password };
    const response = await this.apiService.request('post', this.basePath, parameters);

    this.onLogin.emit({ accessToken: response.accessToken, refreshToken: response.refreshToken });
  }

  public async createWithRefreshToken(token: string) {
    const parameters = { token };
    const response = await this.apiService.request(
      'post',
      this.basePath + '/refresh-token',
      parameters,
    );

    this.onLogin.emit({ accessToken: response.accessToken, refreshToken: response.refreshToken });
  }

  public async delete() {
    await this.apiService.request('delete', this.basePath);

    this.onLogout.emit();
  }
}
