import * as WS from 'ws';

import { Response } from './response';

export class WebSocket<TResponse = unknown> extends WS {
  public isAlive: boolean;
  public send: (data: Response<TResponse>) => void;
}
