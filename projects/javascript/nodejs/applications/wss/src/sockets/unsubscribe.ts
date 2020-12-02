import { AuthenticationData, WebSocket } from '@tenlastic/web-server';

import { consumers } from './subscribe';

export async function unsubscribe(auth: AuthenticationData, data: any, ws: WebSocket) {
  if (!consumers[data._id]) {
    return;
  }

  consumers[data._id].disconnect();
}
