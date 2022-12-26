import { WebSocketModel } from '@tenlastic/mongoose';
import { WebSocketServer } from '@tenlastic/web-socket-server';
import { Server } from 'http';

import { connection } from './connection';
import routes from './routes';

export interface SetupOptions {
  podName: string;
  server: Server;
}

export async function setup(options: SetupOptions) {
  // Delete stale web sockets on startup and SIGTERM.
  await WebSocketModel.deleteMany({ nodeId: options.podName });
  process.on('SIGTERM', async () => {
    await WebSocketModel.deleteMany({ nodeId: options.podName });
    process.exit();
  });

  // Web Sockets.
  const webSocketServer = new WebSocketServer(options.server);
  webSocketServer.connection((state, ws) => connection(options.podName, state, ws));
  webSocketServer.message(routes);
  webSocketServer.listen();
}
