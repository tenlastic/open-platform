import { apiUrl } from '../api-url';
import * as request from '../request';

export class LoginService {
  /**
   * Logs in with username and password.
   */
  public async createWithCredentials(username: string, password: string) {
    const url = this.getUrl();
    const response = await request.promise(url, { json: { password, username }, method: 'post' });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs in with a refresh token.
   */
  public async createWithRefreshToken(refreshToken: string) {
    const url = this.getUrl();
    const response = await request.promise(`${url}/refresh-token`, {
      json: { token: refreshToken },
      method: 'post',
    });

    return { accessToken: response.accessToken, refreshToken: response.refreshToken };
  }

  /**
   * Logs out.
   */
  public async delete() {
    const url = this.getUrl();
    return request.promise(url, { json: true, method: 'delete' });
  }

  private getUrl() {
    return `${apiUrl}/logins`;
  }
}

export const loginService = new LoginService();
