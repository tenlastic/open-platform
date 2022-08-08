import { Axios, AxiosRequestConfig, AxiosStatic } from 'axios';

export type RequestMethod = 'delete' | 'get' | 'patch' | 'post' | 'put';

export class ApiService {
  constructor(private axios: Axios | AxiosStatic) {}

  /**
   * Sends a request to the API, returning the data as a basic object.
   */
  public request(options: AxiosRequestConfig) {
    return this.axios.request(options);
  }
}
