import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebSocket } from '@tenlastic/web-server';

import { GroupInvitation, GroupInvitationPermissions } from '../models';

export async function onConnection(params: any, query: any, user: any, ws: WebSocket) {
  if ('watch' in query) {
    const consumer = await kafka.watch(
      GroupInvitation,
      GroupInvitationPermissions,
      query,
      user,
      payload => ws.send(JSON.stringify(payload)),
    );

    ws.on('close', () => consumer.disconnect());
  }
}
