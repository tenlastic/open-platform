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
      logs(auth, data, ws);
      break;

    case 'ping':
      ping(auth, data, ws);
      break;

    case 'subscribe':
      subscribe(auth, data, ws);
      break;
  }
}
