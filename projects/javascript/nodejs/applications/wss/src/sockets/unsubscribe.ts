import * as webServer from '@tenlastic/web-server';

import { consumers } from './subscribe';

export async function unsubscribe(data: any, jwt: any, ws: webServer.WebSocket) {
  if (!consumers[data._id]) {
    return;
  }

  consumers[data._id].disconnect();
}
