import { Axios, AxiosStatic } from 'axios';

import { TokenService, WebSocketService } from '../services';

export class AccessTokenInterceptor {
  constructor(
    axios: Axios | AxiosStatic,
    tokenService: TokenService,
    webSocketService: WebSocketService,
  ) {
    axios?.interceptors.request.use(async (config) => {
      if (config.url.includes('/logins/refresh-token')) {
        return config;
      }

      const accessToken = await tokenService.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken.value}`;
      }

      return config;
    });

    webSocketService?.interceptors.connect.push(async (url) => {
      const accessToken = await tokenService.getAccessToken();
      if (accessToken) {
        url += url.includes('?') ? `&` : '?';
        url += `access_token=${accessToken.value}`;
      }

      return url;
    });
  }
}
