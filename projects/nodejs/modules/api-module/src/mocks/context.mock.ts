import { IncomingMessage, ServerResponse } from 'http';
import 'koa-bodyparser';

interface Request {
  body?: any;
  headers?: any;
  query?: any;
}

interface Response {
  body?: any;
  status?: number;
}

export class ContextMock {
  public params: any;
  public request: Request;
  public response: Response;
  public state: any;

  constructor(params: Partial<ContextMock> = {}) {
    const defaults = {
      params: {},
      query: {},
      request: {
        body: {},
        headers: {},
        query: {},
      },
      response: {
        body: {},
        status: 404,
      },
      state: {},
    };

    Object.assign(this, defaults, params);
  }
}
