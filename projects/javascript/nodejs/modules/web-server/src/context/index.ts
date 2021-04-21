import * as koa from 'koa';

export interface Request extends koa.Request {
  body?: any;
}

interface Response {
  body?: any;
  status?: number;
}

export interface State {
  apiKey?: string;
  jwt?: any;
  user?: any;
}

export interface Context extends koa.Context {
  params?: any;
  request: Request;
  state: State;
}

export class ContextMock {
  public params: any;
  public request: Partial<Request>;
  public response: Partial<Response>;
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
