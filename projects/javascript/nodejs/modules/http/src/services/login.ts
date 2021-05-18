import { apiUrl } from '../api-url';
import * as request from '../request';

export class LoginService {
  private get url() {
    return `${apiUrl}/logins`;
  }

  /**
   * Logs in with username and password.
   */
  public async createWithCredentials(username: string, password: string) {
    const response = await request.promise(this.url, {
      json: { password, username },
      method: 'post',
    });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs in with a refresh token.
   */
  public async createWithRefreshToken(refreshToken: string) {
    const response = await request.promise(`${this.url}/refresh-token`, {
      json: { token: refreshToken },
      method: 'post',
    });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs out.
   */
  public async delete() {
    return request.promise(this.url, { json: true, method: 'delete' });
  }
}

export const loginService = new LoginService();
