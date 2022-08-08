import { ApiService } from './api';
import { EnvironmentService } from './environment';

export class PasswordResetService {
  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

  /**
   * Requests a Password Reset.
   */
  public async create(email: string) {
    const url = this.getUrl();
    return this.apiService.request({ data: { email }, method: 'post', url });
  }

  /**
   * Completes a Password Reset.
   */
  public async delete(hash: string, password: string) {
    const url = this.getUrl();
    return this.apiService.request({
      method: 'delete',
      params: { password },
      url: `${url}/${hash}`,
    });
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/namespaces`;
  }
}
