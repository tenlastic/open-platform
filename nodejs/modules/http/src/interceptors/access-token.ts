import { Axios, AxiosStatic } from 'axios';

import { TokenService } from '../services/token';

export class AccessTokenInterceptor {
  constructor(axios: Axios | AxiosStatic, tokenService: TokenService) {
    axios.interceptors.request.use(async (config) => {
      if (config.url.includes('/logins/refresh-token')) {
        return config;
      }

      const accessToken = await tokenService.getAccessToken();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken.value}`;
      }

      return config;
    });
  }
}
