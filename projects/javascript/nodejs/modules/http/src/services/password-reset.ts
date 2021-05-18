import { apiUrl } from '../api-url';
import * as request from '../request';

export class PasswordResetService {
  protected get url() {
    return `${apiUrl}/password-resets`;
  }

  /**
   * Sends a Password Reset to the email address
   */
  public async create(email: string) {
    return request.promise(this.url, { json: { email }, method: 'post' });
  }

  /**
   * Resets the password of the User matching the hash.
   */
  public async delete(hash: string, password: string) {
    return request.promise(`${this.url}/${hash}`, {
      json: true,
      method: 'delete',
      qs: { query: JSON.stringify({ password }) },
    });
  }
}

export const passwordResetService = new PasswordResetService();
