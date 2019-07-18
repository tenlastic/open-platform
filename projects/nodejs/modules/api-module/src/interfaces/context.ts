import * as koa from 'koa';

export interface Request extends koa.Request {
  body?: any;
}

export interface State {
  user: any;
}

export interface Context extends koa.Context {
  request: Request;
  state: State;
}
