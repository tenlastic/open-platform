import { Axios, AxiosStatic } from 'axios';

import { EnvironmentService } from '../services/environment';

export class ApiKeyInterceptor {
  constructor(axios: Axios | AxiosStatic, environmentService: EnvironmentService) {
    axios.interceptors.request.use((config) => {
      if (environmentService.apiKey) {
        config.headers['X-Api-Key'] = environmentService.apiKey;
      }

      return config;
    });
  }
}
