import { Axios, AxiosRequestConfig, AxiosStatic } from 'axios';

interface Retries {
  current: number;
  delay: number;
}

export class RetryInterceptor {
  constructor(axios: Axios | AxiosStatic) {
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Add retry settings to request configuration.
        const config = error.config as AxiosRequestConfig & { retries: Retries };
        if (!config.retries) {
          config.retries = { current: 5, delay: 1000 };
        }

        // If retries have been exhausted, return the error.
        if (config.retries.current === 0) {
          throw error;
        }

        // If the method is not idempotent, return the error.
        if (!['delete', 'get', 'head', 'options', 'patch'].includes(error.config.method)) {
          return error;
        }

        // If the status code below 500, return the error.
        if (error?.response?.status > 0 && error?.response?.status < 500) {
          return error;
        }

        config.retries.current--;
        await new Promise((resolve) => setTimeout(resolve, config.retries.delay));

        return axios.request(config);
      },
    );
  }
}
