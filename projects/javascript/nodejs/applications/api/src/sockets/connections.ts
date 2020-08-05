import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket } from '@tenlastic/web-server';

import { Connection, ConnectionPermissions } from '@tenlastic/mongoose-models';

export async function onConnection(params: any, query: any, user: any, ws: WebSocket) {
  createAndDeleteConnection(query, user, ws);

  if ('watch' in query) {
    watchForChanges(query, user, ws);
  }
}

async function createAndDeleteConnection(query: any, user: any, ws: WebSocket) {
  const connection = new Connection({ userId: user._id });
  if (query.gameId) {
    connection.gameId = query.gameId;
  }

  ws.on('close', () => connection.remove());

  return connection.save();
}

async function watchForChanges(query: any, user: any, ws: WebSocket) {
  const consumer = await kafka.watch(Connection, ConnectionPermissions, query, user, payload =>
    ws.send(JSON.stringify(payload)),
  );

  ws.on('close', () => consumer.disconnect());
}
