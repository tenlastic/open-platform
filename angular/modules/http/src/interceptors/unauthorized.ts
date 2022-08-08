import { Axios } from 'axios';

import { LoginService } from '../services/login';

export class UnauthorizedInterceptor {
  constructor(axios: Axios, loginService: LoginService) {
    axios.interceptors.response.use((response) => {
      const isUnauthorized = response.status === 401;
      const refreshTokenIsInvalid =
        response.status === 400 && response.config.url.includes('/logins/refresh-token');

      if (isUnauthorized || refreshTokenIsInvalid) {
        loginService.emitter.emit('logout');
      }
    });
  }
}
