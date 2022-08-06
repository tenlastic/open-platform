import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type RequestMethod = 'delete' | 'get' | 'post' | 'put';

export interface RequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  observe?: string;
  params?: HttpParams | { [param: string]: string | string[] };
  reportProgress?: boolean;
  responseType?: string;
}

export interface RestParameters {
  limit?: number;
  select?: string;
  skip?: number;
  sort?: string;
  where?: any;
}

export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Sends a request to the API, returning the data as a basic object.
   * @param method The HTTP method to use. Ex: 'get', 'post', 'put', 'delete'.
   * @param path The relative path from the object's base endpoint. Ex: '/count', '/recent'.
   * @param parameters The parameters to pass to the endpoint. Ex: { where: { name: 'John Doe' }, limit: 10, sort: 'name' }.
   */
  public observable(
    method: RequestMethod,
    url: string,
    parameters?: any,
    options: RequestOptions = {},
  ): Observable<any> | Promise<any> {
    options.headers = new HttpHeaders();

    if ((method === 'get' || method === 'delete') && parameters) {
      const params = new HttpParams();
      options.params = params.set('query', JSON.stringify(parameters));
    }

    let observable: Observable<ArrayBuffer>;
    switch (method) {
      case 'get':
        this.http.request;
        observable = this.http.get(url, options as any);
        break;

      case 'post':
        observable = this.http.post(url, parameters ? parameters : undefined, options as any);
        break;

      case 'put':
        observable = this.http.put(url, parameters ? parameters : undefined, options as any);
        break;

      case 'delete':
        observable = this.http.delete(url, options as any);
        break;

      default:
        throw new Error('Unsupported HTTP verb.');
    }

    return observable;
  }
}
