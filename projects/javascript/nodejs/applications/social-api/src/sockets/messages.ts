import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket, WebSocketServer } from '@tenlastic/web-server';
import * as http from 'http';

import { Message, MessagePermissions } from '../models';

export function init(server: http.Server) {
  new WebSocketServer(server, { path: '/messages' }, (ws, query, user) =>
    onConnection(ws, query, user),
  );
}

async function onConnection(ws: WebSocket, query: URLSearchParams, user: any) {
  if (query.has('watch')) {
    const consumer = await kafka.watch(Message, MessagePermissions, query, user, payload =>
      ws.send(JSON.stringify(payload)),
    );

    ws.on('close', () => consumer.disconnect());
  }
}
