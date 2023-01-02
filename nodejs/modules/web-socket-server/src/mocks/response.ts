import { Response, StatusCode } from '../definitions';

export class ResponseMock implements Response {
  public _id: string;
  public body: any;
  public headers: { [s: string]: string };
  public status: StatusCode;

  constructor(parameters?: Partial<Response>) {
    this.body = {};
    this.headers = {};
    this.status = StatusCode.OK;

    Object.assign(this, parameters);
  }
}
