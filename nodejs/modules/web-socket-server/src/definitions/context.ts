import * as mongoose from 'mongoose';

import { Request } from './request';
import { Response } from './response';
import { WebSocket } from './web-socket';

export class Context<T = { [key: string]: any }> {
  public params: { [key: string]: string };
  public request: Request<T>;
  public response: Response;
  public state: State;
  public ws: WebSocket;

  constructor(parameters?: Partial<Context>) {
    Object.assign(this, parameters);
  }
}

export interface Jwt {
  authorization?: { _id?: string; roles?: string[] };
  jti?: string;
  user?: { _id?: string; username?: string };
}

export interface State<T extends mongoose.Document = mongoose.Document> {
  apiKey?: string;
  authorization?: { _id?: string; roles?: string[] };
  jwt?: Jwt;
  user?: { _id?: string; username?: string };
  webSocket?: T;
}
