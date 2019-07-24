import * as koa from 'koa';

export interface Request extends koa.Request {
  body?: any;
}

export interface State {
  jwt?: any;
  user?: any;
}

export interface Context extends koa.Context {
  params?: any;
  request: Request;
  state: State;
}
