import * as koa from 'koa';

export interface Jwt {
  authorization?: { _id?: string; roles?: string[] };
  jti?: string;
  user?: { _id?: string; username?: string };
}

export interface Request extends koa.Request {
  body?: any;
  rawQuery?: { [key: string]: string };
}

interface Response {
  body?: any;
  status?: number;
}

export interface State {
  apiKey?: string;
  authorization?: { _id?: string; roles?: string[] };
  jwt?: Jwt;
  user?: { _id?: string; username?: string };
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
