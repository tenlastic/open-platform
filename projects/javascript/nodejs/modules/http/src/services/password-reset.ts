import * as requestPromiseNative from 'request-promise-native';

import { accessToken } from '../access-token';

const apiUrl = process.env.API_URL;

export class PasswordResetService {
  private url = `${apiUrl}/password-resets`;

  // Using Getter since Access Token may change.
  private get headers() {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Sends a Password Reset to the email address
   */
  public async create(email: string) {
    return requestPromiseNative.post({ headers: this.headers, json: { email }, url: this.url });
  }

  /**
   * Resets the password of the User matching the hash.
   */
  public async delete(hash: string, password: string) {
    return requestPromiseNative.delete({
      headers: this.headers,
      json: true,
      qs: { query: JSON.stringify({ password }) },
      url: `${this.url}/${hash}`,
    });
  }
}

export const passwordResetService = new PasswordResetService();
