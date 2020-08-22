import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as webServer from '@tenlastic/web-server';

import { WebSocket, WebSocketPermissions } from '@tenlastic/mongoose-models';

export async function onConnection(params: any, query: any, user: any, ws: webServer.WebSocket) {
  createAndDeleteWebSocket(query, user, ws);

  if ('watch' in query) {
    watchForChanges(query, user, ws);
  }
}

async function createAndDeleteWebSocket(query: any, user: any, ws: webServer.WebSocket) {
  const connection = new WebSocket({ userId: user._id });
  if (query.gameId) {
    connection.gameId = query.gameId;
  }

  ws.on('close', () => connection.remove());

  return connection.save();
}

async function watchForChanges(query: any, user: any, ws: webServer.WebSocket) {
  const consumer = await kafka.watch(WebSocket, WebSocketPermissions, query, user, payload =>
    ws.send(JSON.stringify(payload)),
  );

  ws.on('close', () => consumer.disconnect());
}
