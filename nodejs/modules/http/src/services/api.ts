import { Axios, AxiosDefaults, AxiosRequestConfig, AxiosResponse, AxiosStatic } from 'axios';

import { ApiError } from '../errors';

export type RequestMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

export class ApiService {
  constructor(private axios: Axios | AxiosStatic) {
    this.axios.defaults = axios.defaults || ({} as AxiosDefaults);
    this.axios.interceptors.response.use((response) => {
      if (
        response.data &&
        typeof response.data === 'string' &&
        response.headers['content-type'].includes('application/json')
      ) {
        response.data = JSON.parse(response.data);
      }

      return response;
    });
  }

  /**
   * Sends a request to the API, returning the data as a basic object.
   */
  public async request(config: AxiosRequestConfig) {
    config.headers = config.headers || {};
    config.responseType = config.responseType || 'json';
    config.validateStatus = (status) => status < 400;

    if (config.data) {
      if (config.data.constructor.name === 'FormData') {
        config.headers['Content-Type'] = 'multipart/form-data';
      } else if (config.data.constructor.name === 'Object') {
        config.data = JSON.stringify(config.data);
        config.headers['Content-Type'] = 'application/json';
      }
    }

    if (config.params && typeof config.params !== 'string') {
      config.params = { query: JSON.stringify(config.params) };
    }

    if (config.responseType === 'json') {
      config.headers.Accept = 'application/json';
    } else if (config.responseType === 'stream') {
      config.headers.Accept = 'application/octet-stream';
    }

    let response: AxiosResponse<any, any>;
    try {
      response = await this.axios.request(config);
    } catch (e) {
      throw new ApiError(e);
    }

    return response;
  }
}
