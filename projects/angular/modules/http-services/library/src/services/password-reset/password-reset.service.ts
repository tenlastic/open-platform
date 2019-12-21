import { Injectable } from '@angular/core';

import { ApiService } from '../api/api.service';
import { EnvironmentService } from '../environment/environment.service';

@Injectable()
export class PasswordResetService {
  public basePath: string;

  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {
    this.basePath = this.environmentService.passwordResetApiBaseUrl;
  }

  public async create(email: string) {
    const parameters = { email };
    return this.apiService.request('post', this.basePath, parameters);
  }

  public async delete(hash: string, password: string) {
    const parameters = { password };
    return this.apiService.request('delete', `${this.basePath}/${hash}`, parameters);
  }
}
