import { Axios, AxiosStatic } from 'axios';

import { LoginService } from '../services/login';

export class InvalidRefreshTokenInterceptor {
  constructor(axios: Axios | AxiosStatic, loginService: LoginService) {
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.request.url.endsWith('/logins/refresh-token') && error.response.status === 401) {
          loginService.emitter.emit('logout');
        }

        return Promise.reject(error);
      },
    );
  }
}
