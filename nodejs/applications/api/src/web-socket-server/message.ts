import {
  AuthenticationData,
  MessageData,
  ping,
  WebSocket as WS,
} from '@tenlastic/web-socket-server';

import { subscribe } from './subscribe';

export function message(auth: AuthenticationData, data: MessageData, ws: WS) {
  switch (data.method) {
    case 'ping':
      return ping(auth, data, ws);

    case 'subscribe':
      return subscribe(auth, data, ws);
  }
}
