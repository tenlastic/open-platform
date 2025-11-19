import { Request } from './request';
import { Response } from './response';
import { WebSocket } from './web-socket';

export class Context<TRequest = unknown, TResponse = unknown> {
  public params: { [key: string]: string };
  public request: Request<TRequest>;
  public response: Response<TResponse>;
  public state: State;
  public ws: WebSocket<TResponse>;

  constructor(parameters?: Partial<Context<TRequest, TResponse>>) {
    this.params = parameters.params;
    this.request = parameters.request;
    this.response = parameters.response;
    this.state = parameters.state;
    this.ws = parameters.ws;
  }
}

export interface Jwt {
  authorization?: { _id?: string; roles?: string[] };
  jti?: string;
  user?: { _id?: string; username?: string };
}

export interface State {
  apiKey?: string;
  authorization?: { _id?: string; roles?: string[] };
  jwt?: Jwt;
  user?: { _id?: string; username?: string };
  webSocket?: { _id?: string; namespaceId?: string };
}
