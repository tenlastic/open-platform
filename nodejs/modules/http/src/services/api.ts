import { Axios, AxiosRequestConfig, AxiosStatic } from 'axios';

export type RequestMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

export class ApiService {
  constructor(private axios: Axios | AxiosStatic) {}

  /**
   * Sends a request to the API, returning the data as a basic object.
   */
  public async request(config: AxiosRequestConfig) {
    config.headers = { Accept: 'application/json' };
    config.validateStatus = (status) => status < 400;

    if (config.data && typeof config.data !== 'string') {
      config.data = JSON.stringify(config.data);
      config.headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await this.axios.request(config);

      if (response.data && response.headers['content-type'].includes('application/json')) {
        response.data = JSON.parse(response.data);
      }

      return response;
    } catch (e) {
      if (e.response.data && e.response.headers['content-type'].includes('application/json')) {
        e.response.data = JSON.parse(e.response.data);
      }

      throw e;
    }
  }
}
