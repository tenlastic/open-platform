import { WebSocketServer } from '@tenlastic/web-socket-server';
import { Server } from 'http';

import { WebSocket } from '../mongodb';
import { connection } from './connection';
import { message } from './message';

export interface SetupOptions {
  podName: string;
  server: Server;
}

export async function setup(options: SetupOptions) {
  // Delete stale web sockets on startup and SIGTERM.
  await WebSocket.deleteMany({ nodeId: options.podName });
  process.on('SIGTERM', async () => {
    await WebSocket.deleteMany({ nodeId: options.podName });
    process.exit();
  });

  // Web Sockets.
  const webSocketServer = new WebSocketServer(options.server);
  webSocketServer.connection((auth, ws) => connection(auth, options.podName, ws));
  webSocketServer.message(message);
}
