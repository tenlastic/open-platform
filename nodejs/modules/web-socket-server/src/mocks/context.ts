import { Context, Request, Response, State, WebSocket } from '../definitions';
import { RequestMock } from './request';
import { ResponseMock } from './response';

export class ContextMock implements Context {
  public params: { [key: string]: string };
  public request: Request;
  public response: Response;
  public state: State;
  public ws: WebSocket;

  constructor(parameters?: Partial<Context>) {
    this.params = {};
    this.request = new RequestMock();
    this.response = new ResponseMock();
    this.state = {};

    Object.assign(this, parameters);
  }
}
