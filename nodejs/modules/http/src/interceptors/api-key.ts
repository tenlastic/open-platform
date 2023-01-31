import { Axios, AxiosStatic } from 'axios';

import { EnvironmentService, WebSocketService } from '../services';

export class ApiKeyInterceptor {
  constructor(
    axios: Axios | AxiosStatic,
    environmentService: EnvironmentService,
    webSocketService: WebSocketService,
  ) {
    axios?.interceptors.request.use((config) => {
      if (environmentService.apiKey) {
        config.headers['X-Api-Key'] = environmentService.apiKey;
      }

      return config;
    });

    webSocketService?.interceptors.connect.push((url) => {
      if (environmentService.apiKey) {
        url += url.includes('?') ? `&` : '?';
        url += `api_key=${environmentService.apiKey}`;
      }

      return url;
    });
  }
}
