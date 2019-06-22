import { IncomingMessage, ServerResponse } from 'http';
import { Request, Response } from 'koa';

export class ContextMock {
  public params: any;
  public req: Partial<IncomingMessage>;
  public request: Partial<Request>;
  public res: Partial<ServerResponse>;
  public response: Partial<Response>;
  public state: any;

  constructor(params: Partial<ContextMock> = {}) {
    const defaults = {
      params: {},
      query: {},
      req: {
        headers: {},
      },
      request: {
        body: {},
        params: {},
        query: {},
      },
      state: {},
    };

    Object.assign(this, defaults, params);
  }
}
