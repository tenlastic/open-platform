import { Headers, Method, Request } from '../definitions';

export class RequestMock implements Request {
  public _id: string;
  public body: any;
  public headers: Headers;
  public method: Method;
  public path: string;

  constructor(parameters?: Partial<Request>) {
    this.body = {};
    this.headers = {};

    Object.assign(this, parameters);
  }
}
