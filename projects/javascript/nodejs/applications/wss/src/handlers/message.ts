import {
  AuthenticationData,
  MessageData,
  ping,
  unsubscribe,
  WebSocket as WS,
} from '@tenlastic/web-socket-server';

import { logs } from './logs';
import { subscribe } from './subscribe';

export function message(auth: AuthenticationData, data: MessageData, ws: WS) {
  switch (data.method) {
    case 'logs':
      return logs(auth, data, ws);

    case 'ping':
      return ping(auth, data, ws);

    case 'subscribe':
      return subscribe(auth, data, ws);
  }
}
