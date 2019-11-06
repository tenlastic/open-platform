import { Injectable, EventEmitter } from '@angular/core';

import { ApiService } from '@app/core/http/api/api.service';
import { environment } from '@env/environment';

export interface IOnLogin {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginService {
  public basePath = environment.loginApiBaseUrl;

  public onLogin = new EventEmitter<IOnLogin>();
  public onLogout = new EventEmitter();

  constructor(private apiService: ApiService) {}

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
