import { Injectable } from '@angular/core';

import { ApiService } from '@app/core/http/api/api.service';
import { environment } from '@env/environment';

@Injectable()
export class PasswordResetService {
  public basePath = environment.passwordResetApiBaseUrl;

  constructor(private apiService: ApiService) {}

  public async create(email: string) {
    const parameters = { email };
    return this.apiService.request('post', this.basePath, parameters);
  }

  public async delete(hash: string, password: string) {
    const parameters = { password };
    return this.apiService.request('delete', `${this.basePath}/${hash}`, parameters);
  }
}
