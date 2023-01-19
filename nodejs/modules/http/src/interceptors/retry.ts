import { Axios, AxiosRequestConfig, AxiosStatic } from 'axios';

interface Retries {
  current: number;
  delay: number;
}

type AxiosRequestConfigWithRetries = AxiosRequestConfig & { retries: Retries };

export class RetryInterceptor {
  private axios: Axios | AxiosStatic;

  constructor(axios: Axios | AxiosStatic) {
    this.axios = axios;

    this.axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Add retry settings to request configuration.
        const config = error.config as AxiosRequestConfigWithRetries;
        if (!config.retries) {
          config.retries = { current: 5, delay: 1000 };
        }

        // If retries have been exhausted, return the error.
        if (config.retries.current === 0) {
          throw error;
        }

        // If the status code is undefined or the endpoint was unreachable, automatically retry.
        if (!error?.response?.status || error.response.status === 503) {
          return this.retry(config);
        }

        // If the status code is below 500, return the error.
        if (error?.response?.status < 500) {
          throw error;
        }

        // If the method was not idempotent, return the error.
        if (!['delete', 'get', 'head', 'options', 'patch'].includes(error.config.method)) {
          throw error;
        }

        return this.retry(config);
      },
    );
  }

  private async retry(config: AxiosRequestConfigWithRetries) {
    await new Promise((resolve) => setTimeout(resolve, config.retries.delay));

    config.retries.current--;
    config.retries.delay *= 2;

    return this.axios.request(config);
  }
}
