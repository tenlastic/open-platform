import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket } from '@tenlastic/web-server';

import { Connection, ConnectionPermissions } from '../models';

export async function onConnection(params: any, query: any, user: any, ws: WebSocket) {
  if ('watch' in query) {
    const consumer = await kafka.watch(
      Connection,
      ConnectionPermissions,
      query.watch,
      user,
      payload => ws.send(JSON.stringify(payload)),
    );

    ws.on('close', () => consumer.disconnect());
  }

  ws.on('close', async () => {
    await Connection.findOneAndUpdate(
      {
        disconnectedAt: { $exists: false },
        gameId: query.gameId,
        userId: user._id,
      },
      {
        disconnectedAt: new Date(),
      },
    );
  });
}

export async function onUpgradeRequest(params: string, query: any, user: any) {
  await Connection.create({ gameId: query.gameId, userId: user._id });
}
