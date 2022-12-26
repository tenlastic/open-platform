import * as WS from 'ws';

import { Response } from './response';

export class WebSocket extends WS {
  public isAlive: boolean;
  public send: (data: Response) => void;
}
