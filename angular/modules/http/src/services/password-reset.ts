import { ApiService } from './api/api';
import { EnvironmentService } from './environment';

export class PasswordResetService {
  constructor(private apiService: ApiService, private environmentService: EnvironmentService) {}

  /**
   * Requests a Password Reset.
   */
  public async create(email: string) {
    const url = this.getUrl();
    return this.apiService.observable('post', url, { email });
  }

  /**
   * Completes a Password Reset.
   */
  public async delete(hash: string, password: string) {
    const url = this.getUrl();
    return this.apiService.observable('delete', `${url}/${hash}`, { password });
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl() {
    return `${this.environmentService.apiUrl}/namespaces`;
  }
}
