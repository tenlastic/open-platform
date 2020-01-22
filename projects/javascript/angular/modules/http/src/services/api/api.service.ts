import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

export type RequestMethod = 'delete' | 'get' | 'post' | 'put';

export interface RequestOptions {
  headers?:
    | HttpHeaders
    | {
        [header: string]: string | string[];
      };
  observe?: string;
  params?:
    | HttpParams
    | {
        [param: string]: string | string[];
      };
  reportProgress?: boolean;
  responseType?: string;
  withCredentials?: boolean;
}

export interface RestParameters {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Sends a request to the API, returning the data as a basic object.
   * @param method The HTTP method to use. Ex: 'get', 'post', 'put', 'delete'.
   * @param path The relative path from the object's base endpoint. Ex: '/count', '/recent'.
   * @param params The parameters to pass to the endpoint. Ex: { where: { name: 'John Doe' }, limit: 10, sort: 'name' }.
   */
  public request(
    method: RequestMethod,
    url: string,
    params?: any,
    options: RequestOptions = {},
  ): Promise<any> {
    options.headers = new HttpHeaders();

    if ((method === 'get' || method === 'delete') && params) {
      options.params = new HttpParams().set('query', JSON.stringify(params));
    }

    switch (method) {
      case 'get':
        return this.http.get(url, options as any).toPromise();
      case 'post':
        return this.http.post(url, params ? params : undefined, options as any).toPromise();
      case 'put':
        return this.http.put(url, params ? params : undefined, options as any).toPromise();
      case 'delete':
        return this.http.delete(url, options as any).toPromise();
      default:
        throw new Error('Unsupported HTTP verb.');
    }
  }
}
