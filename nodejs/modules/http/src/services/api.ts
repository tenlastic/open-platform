import {
  Axios,
  AxiosDefaults,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosStatic,
} from 'axios';

export class ApiError extends Error {
  public errors = [];
  public messages: string[] = [];
  public method = 'get';
  public status = 500;
  public url: string;

  constructor(e: AxiosError) {
    let errors: any[] = [e.response.data as any];
    if (typeof e.response?.data === 'string') {
      errors = JSON.parse(e.response.data).errors;
    }
    const messages = errors.map((e) => e.message);
    const method = e.config.method;
    const status = e.response?.status;
    const url = e.config?.url;

    super(`${method.toUpperCase()} to ${url} responded with ${status}: ${messages.join(', ')}`);

    this.errors = errors;
    this.messages = messages;
    this.method = method;
    this.status = status;
    this.url = url;
  }
}

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
