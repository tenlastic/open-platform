import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket, WebSocketServer } from '@tenlastic/web-server';
import * as http from 'http';

import { Connection, ConnectionPermissions } from '../models';

export function init(server: http.Server) {
  new WebSocketServer(
    server,
    { path: '/messages' },
    (ws, query, user) => onConnection(ws, query, user),
    (query, user) => onUpgradeRequest(query, user),
  );
}

async function onConnection(ws: WebSocket, query: URLSearchParams, user: any) {
  if (query.has('watch')) {
    const consumer = await kafka.watch(Connection, ConnectionPermissions, query, user, payload =>
      ws.send(JSON.stringify(payload)),
    );

    ws.on('close', () => consumer.disconnect());
  }

  ws.on('close', () =>
    Connection.findOneAndUpdate(
      {
        disconnectedAt: { $exists: false },
        gameId: query.get('gameId'),
        userId: user._id,
      },
      {
        disconnectedAt: new Date(),
      },
    ),
  );
}

async function onUpgradeRequest(query: URLSearchParams, user: any) {
  return Connection.create({ gameId: query.get('gameId'), userId: user._id });
}
