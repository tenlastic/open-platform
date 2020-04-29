import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket } from '@tenlastic/web-server';

import { ReleaseTask, ReleaseTaskPermissions } from '../models';

export async function onConnection(params: any, query: any, user: any, ws: WebSocket) {
  if ('watch' in query) {
    const { watch } = query;
    watch.releaseId = params.releaseId;

    const consumer = await kafka.watch(ReleaseTask, ReleaseTaskPermissions, watch, user, payload =>
      ws.send(JSON.stringify(payload)),
    );

    ws.on('close', () => consumer.disconnect());
  }
}
