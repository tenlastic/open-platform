import { apiUrl } from '../api-url';
import * as request from '../request';

export class PasswordResetService {
  /**
   * Sends a Password Reset to the email address
   */
  public async create(email: string) {
    const url = this.getUrl();
    return request.promise(url, { json: { email }, method: 'post' });
  }

  /**
   * Resets the password of the User matching the hash.
   */
  public async delete(hash: string, password: string) {
    const url = this.getUrl();
    return request.promise(`${url}/${hash}`, {
      json: true,
      method: 'delete',
      qs: { query: JSON.stringify({ password }) },
    });
  }

  private getUrl() {
    return `${apiUrl}/password-resets`;
  }
}

export const passwordResetService = new PasswordResetService();
