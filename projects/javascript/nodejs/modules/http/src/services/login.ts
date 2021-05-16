import * as requestPromiseNative from 'request-promise-native';

import { accessToken } from '../access-token';

const apiUrl = process.env.API_URL;

export class LoginService {
  private url = `${apiUrl}/logins`;

  // Using Getter since Access Token may change.
  private get headers() {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Logs in with username and password.
   */
  public async createWithCredentials(username: string, password: string) {
    const response = await requestPromiseNative.post({
      headers: this.headers,
      json: { password, username },
      url: this.url,
    });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs in with a refresh token.
   */
  public async createWithRefreshToken(refreshToken: string) {
    const response = await requestPromiseNative.post({
      headers: this.headers,
      json: { token: refreshToken },
      url: `${this.url}/refresh-token`,
    });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs out.
   */
  public async delete() {
    return requestPromiseNative.delete({ headers: this.headers, json: true, url: this.url });
  }
}

export const loginService = new LoginService();
